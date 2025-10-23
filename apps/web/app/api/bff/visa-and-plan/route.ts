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

    // 2) Checklist templates (by country/visa type)
    let visaType = visa?.visa_type || null
    const { data: checklist, error: chkErr } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('country_code', country)
      .or(visaType ? `visa_type.eq.${visaType},visa_type.is.null` : 'visa_type.is.null')

    if (chkErr) throw chkErr

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
      checklist: checklist || [],
      last_updated: visa?.updated_at || visa?.fetched_at || null,
      source
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
