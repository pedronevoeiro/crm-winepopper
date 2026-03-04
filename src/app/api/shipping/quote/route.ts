import { NextResponse } from 'next/server'

const MELHORENVIO_BASE_URL = 'https://www.melhorenvio.com.br/api/v2/me'

// Product dimensions/weights (same as B2B site products)
const PRODUCT_SPECS: Record<string, { weightGrams: number; heightCm: number; widthCm: number; lengthCm: number }> = {
  classico:  { weightGrams: 180, heightCm: 14, widthCm: 5, lengthCm: 5 },
  lite_plus: { weightGrams: 120, heightCm: 13, widthCm: 4, lengthCm: 4 },
  lite:      { weightGrams: 90,  heightCm: 12, widthCm: 3.5, lengthCm: 3.5 },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cep, product_id, quantity } = body

    if (!cep || !product_id || !quantity) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: cep, product_id, quantity' },
        { status: 400 }
      )
    }

    const specs = PRODUCT_SPECS[product_id]
    if (!specs) {
      return NextResponse.json(
        { error: `Produto desconhecido: ${product_id}. Válidos: ${Object.keys(PRODUCT_SPECS).join(', ')}` },
        { status: 400 }
      )
    }

    const token = process.env.MELHORENVIO_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'MELHORENVIO_TOKEN não configurada' }, { status: 500 })
    }

    const cepOrigem = process.env.MELHORENVIO_CEP_ORIGEM
    if (!cepOrigem) {
      return NextResponse.json({ error: 'MELHORENVIO_CEP_ORIGEM não configurada' }, { status: 500 })
    }

    // Calculate dimensions
    const totalWeightKg = (specs.weightGrams * quantity) / 1000
    const totalHeightCm = Math.min(specs.heightCm * quantity, 100) // Correios limit

    const payload = {
      from: { postal_code: cepOrigem.replace(/\D/g, '') },
      to: { postal_code: String(cep).replace(/\D/g, '') },
      products: [
        {
          weight: totalWeightKg,
          width: specs.widthCm,
          height: totalHeightCm,
          length: specs.lengthCm,
          insurance_value: 100,
        },
      ],
      services: ['1', '2', '3', '4'], // PAC, SEDEX, Jadlog .package, Jadlog .com
    }

    const res = await fetch(`${MELHORENVIO_BASE_URL}/shipment/calculate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Winepopper CRM (contato@winepopper.com.br)',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Erro da API Melhor Envio:', res.status, errorText)
      return NextResponse.json({ error: 'Erro ao consultar frete' }, { status: 502 })
    }

    const quotes = (await res.json()) as Array<{
      id: number
      name: string
      price: string
      delivery_time: number
      company: { name: string }
      error?: string
    }>

    const filtered = quotes
      .filter((q) => !q.error && q.price)
      .filter((q) => {
        const co = (q.company?.name ?? '').toLowerCase()
        return co.includes('correios') || co.includes('jadlog')
      })
      .map((q) => ({
        id: q.id,
        name: q.name,
        price: parseFloat(q.price),
        delivery_days: q.delivery_time,
        company: q.company.name,
      }))
      .sort((a, b) => a.price - b.price)

    return NextResponse.json(filtered)
  } catch (err) {
    console.error('Erro inesperado em POST /api/shipping/quote:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
