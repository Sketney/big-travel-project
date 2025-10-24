import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { passport, country } = await req.json()
    if (!passport || !country) {
      return NextResponse.json({ error: 'passport and country are required' }, { status: 400 })
    }

    const supabase = supabaseServer()

    // 1) Visa requirement (current snapshot)
    const { data: visa, error: visaErr } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('citizenship_code', passport)
      .eq('destination_code', country)
      .eq('is_current', true)
      .limit(1)
      .maybeSingle()

    if (visaErr) throw visaErr

// 2) Visa documents (v1.2): гражданство + страна назначения
    const { data: docs, error: docsErr } = await supabase
      .from('visa_documents')
      .select('*')
      .eq('citizenship_code', passport)
      .eq('destination_code', country)
      .order('order_index', { ascending: true });

    if (docsErr) throw docsErr

// Приведём к простому чек-листу для фронта
    const checklist = (docs || []).map(d => ({
      id: d.id,
      title: d.document_name,
      is_required: d.is_required,
      notes: d.description,
      order_index: d.order_index
    }));


    // 3) Source attribution (if present)
    let source = null as any
    if (visa?.source_attribution_id) {
      const { data: src } = await supabase
        .from('source_attribution')
        .select('*')
        .eq('id', visa.source_attribution_id)
        .maybeSingle()
      source = src
    }

    return NextResponse.json({
      passport,
      country,
      visa_status: visa?.visa_required ? (visa.visa_type || 'visa') : (visa?.visa_type || 'visa-free'),
      visa_raw: visa,
      checklist, // ← вот это
      last_updated: visa?.updated_at || visa?.fetched_at || null,
      source
    })

  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
