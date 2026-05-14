import { createClient } from "@/lib/db-server"

export interface ContentBlockRecord {
  id: string
  block_identifier: string
  block_name: string
  block_type: string
  content: Record<string, unknown> | null
  is_published: boolean
  updated_by: string | null
  updated_at: string
}

export async function fetchPublishedContentBlockByIdentifier(identifier: string) {
  const db = await createClient()
  const { data, error } = await db
    .from("content_blocks")
    .select("*")
    .eq("block_identifier", identifier)
    .eq("is_published", true)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching content block ${identifier}:`, error)
    return null
  }

  return data as ContentBlockRecord | null
}


