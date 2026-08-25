import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {
  initUserPracticeExpertsDb,
  createUserPracticeExpert,
  listUserPracticeExperts,
  getUserPracticeExpert,
  updateUserPracticeExpert,
  deleteUserPracticeExpert,
  formatUserExpertId,
  userExpertRowToPersona,
  isUserExpertId,
} from '../userPracticeExperts.js';
import { resolvePracticeExpert, isValidExpertIdFormat } from '../practiceExperts.js';

const { Pool } = pg;
const TEST_USER = 900001;

describe('userPracticeExperts', () => {
  /** @type {import('pg').Pool} */
  let pool;

  before(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.log('skip userPracticeExperts tests: DATABASE_URL not set');
      return;
    }
    pool = new Pool({ connectionString: url });
    await initUserPracticeExpertsDb(pool);
    await pool.query('DELETE FROM user_practice_experts WHERE vk_user_id = $1', [TEST_USER]);
  });

  after(async () => {
    if (!pool) return;
    await pool.query('DELETE FROM user_practice_experts WHERE vk_user_id = $1', [TEST_USER]);
    await pool.end();
  });

  it('validates user expert id format', () => {
    assert.equal(isUserExpertId('u42'), true);
    assert.equal(isUserExpertId('philosopher'), false);
    assert.equal(isValidExpertIdFormat('u1'), true);
    assert.equal(isValidExpertIdFormat('philosopher'), true);
    assert.equal(isValidExpertIdFormat('nope'), false);
  });

  it('creates, lists, updates, deletes user experts', async (t) => {
    if (!pool) {
      t.skip('DATABASE_URL not set');
      return;
    }

    const created = await createUserPracticeExpert(TEST_USER, {
      title: 'My chef',
      roleTitle: 'Professional chef',
      sampleTopics: 'home cooking, spices, kitchen tools',
    });
    assert.ok(created.id.startsWith('u'));
    assert.equal(created.title, 'My chef');

    const list = await listUserPracticeExperts(TEST_USER);
    assert.equal(list.length, 1);
    assert.equal(list[0].id, created.id);

    const row = await getUserPracticeExpert(TEST_USER, created.id);
    assert.ok(row);
    const persona = userExpertRowToPersona(row);
    assert.equal(persona.roleTitle, 'Professional chef');
    assert.match(persona.domain, /Professional chef/);

    const resolved = await resolvePracticeExpert(created.id, TEST_USER);
    assert.equal(resolved.roleTitle, 'Professional chef');

    const updated = await updateUserPracticeExpert(TEST_USER, created.id, {
      title: 'Chef friend',
    });
    assert.equal(updated.title, 'Chef friend');

    const ok = await deleteUserPracticeExpert(TEST_USER, created.id);
    assert.equal(ok, true);
    assert.equal((await listUserPracticeExperts(TEST_USER)).length, 0);
  });

  it('formats db id', () => {
    assert.equal(formatUserExpertId(7), 'u7');
  });
});
