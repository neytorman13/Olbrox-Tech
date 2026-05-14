export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

const defaultBlocks = [
  {
    block_identifier: 'hero',
    block_name: 'Hero Section',
    block_type: 'hero',
    content: {
      title: 'Soluciones tecnológicas innovadoras',
      subtitle: 'Impulsamos tu negocio al siguiente nivel',
      cta_text: 'Solicitar Cotización',
      cta_link: '#contacto',
      image_url: '/images/hero-bg.jpg',
      tagline: 'Tecnología que transforma tu negocio.',
    },
    is_published: true,
  },
  {
    block_identifier: 'about',
    block_name: 'About Section',
    block_type: 'text',
    content: {
      title: 'Quiénes Somos',
      description: 'Somos un equipo de profesionales apasionados en tecnología, dedicados a transformar ideas en soluciones digitales.',
    },
    is_published: true,
  },
  {
    block_identifier: 'cta',
    block_name: 'Call to Action',
    block_type: 'cta',
    content: {
      title: '¿Listo para transformar tu negocio?',
      description: 'Ponte en contacto con nosotros hoy',
      subtitle: 'Empecemos tu proyecto juntos.',
      button_text: 'Solicitar Demo',
      button_link: '#contacto',
    },
    is_published: true,
  },
]

export async function GET() {
  try {
    const rows = await query<any[]>(
      `SELECT * FROM content_blocks ORDER BY block_name ASC`,
    )

    if (rows.length > 0) {
      return NextResponse.json({ blocks: rows })
    }

    for (const block of defaultBlocks) {
      await query(
        `INSERT INTO content_blocks (
          id,
          block_identifier,
          block_name,
          block_type,
          content,
          is_published,
          updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
        [
          block.block_identifier,
          block.block_name,
          block.block_type,
          JSON.stringify(block.content),
          block.is_published,
        ],
      )
    }

    const newRows = await query<any[]>(
      `SELECT * FROM content_blocks ORDER BY block_name ASC`,
    )

    return NextResponse.json({ blocks: newRows || [] })
  } catch (error) {
    console.error('Unexpected error in admin content ensure route:', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


