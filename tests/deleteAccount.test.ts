/**
 * Unit tests for deleteAccount avatar cleanup.
 *
 * Web names avatars `<timestamp>.<ext>` and leaves older uploads behind, so a
 * hardcoded `avatar.jpg` would orphan every web avatar. These tests prove the
 * cleanup lists the user's folder and removes whatever is actually there.
 * Uses a mock Supabase client (no network).
 *
 * npx vitest run tests/deleteAccount.test.ts
 */
import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { deleteAccount } from '../src/helpers/deleteAccount'

function makeClient(listFiles: { name: string }[]) {
  const remove = vi.fn().mockResolvedValue({ data: [], error: null })
  const list = vi.fn().mockResolvedValue({ data: listFiles, error: null })
  const rpc = vi.fn().mockResolvedValue({ data: { error: null }, error: null })
  const client = {
    storage: { from: () => ({ list, remove }) },
    rpc,
  } as unknown as SupabaseClient
  return { client, list, remove, rpc }
}

describe('deleteAccount — avatar cleanup', () => {
  it('removes every file in the user folder, whatever their names', async () => {
    const { client, list, remove } = makeClient([
      { name: '1718000000000.png' },
      { name: '1718000999999.webp' },
    ])

    const result = await deleteAccount(client, 'user-1')

    expect(list).toHaveBeenCalledWith('user-1')
    expect(remove).toHaveBeenCalledWith([
      'user-1/1718000000000.png',
      'user-1/1718000999999.webp',
    ])
    expect(result.error).toBeNull()
  })

  it('skips the remove call when the folder is empty', async () => {
    const { client, remove } = makeClient([])

    await deleteAccount(client, 'user-1')

    expect(remove).not.toHaveBeenCalled()
  })

  it('still runs the account-delete RPC after cleanup', async () => {
    const { client, rpc } = makeClient([{ name: 'avatar.jpg' }])

    await deleteAccount(client, 'user-1')

    expect(rpc).toHaveBeenCalledWith('delete_user_account')
  })
})
