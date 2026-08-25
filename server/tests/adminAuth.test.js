import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAppOwnerUserId,
  isAppAdmin,
  isAppOwner,
  parseAdminUserIds,
  resetAdminCacheForTests,
} from '../adminAuth.js';

describe('adminAuth', () => {
  const prevAdminUserIds = process.env.ADMIN_USER_IDS;
  const prevOwner = process.env.APP_OWNER_USER_ID;

  afterEach(() => {
    if (prevAdminUserIds === undefined) delete process.env.ADMIN_USER_IDS;
    else process.env.ADMIN_USER_IDS = prevAdminUserIds;
    if (prevOwner === undefined) delete process.env.APP_OWNER_USER_ID;
    else process.env.APP_OWNER_USER_ID = prevOwner;
    resetAdminCacheForTests();
  });

  it('parseAdminUserIds reads comma-separated ids', () => {
    process.env.ADMIN_USER_IDS = '42, 1001';
    assert.deepEqual(parseAdminUserIds(), [42, 1001]);
  });

  it('owner is always admin', () => {
    delete process.env.ADMIN_USER_IDS;
    resetAdminCacheForTests();
    const owner = getAppOwnerUserId();
    assert.equal(isAppOwner(owner), true);
    assert.equal(isAppAdmin(owner), true);
    assert.equal(isAppAdmin(owner + 1), false);
  });

  it('isAppAdmin matches configured ids only', () => {
    process.env.ADMIN_USER_IDS = '42,1001';
    resetAdminCacheForTests();
    assert.equal(isAppAdmin(42), true);
    assert.equal(isAppAdmin(1001), true);
    assert.equal(isAppAdmin(99), false);
  });
});
