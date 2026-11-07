// Test cho server/src/common/utils/text.ts (B2: BR13, BR16).
// Chạy bằng: node --test server/src/common/utils/text.test.ts
// Hoặc:      npm test -- server/src/common/utils/text.test.ts

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractHashtags, escapeRegex, normalizeKey } from './text';

describe('normalizeKey', () => {
  it('chữ thường, bỏ dấu, gộp khoảng trắng', () => {
    assert.equal(normalizeKey('Hội   An'), 'hoi an');
  });

  it('đổi đ → d', () => {
    assert.equal(normalizeKey('Đà Lạt'), 'da lat');
  });

  it('cắt khoảng trắng hai đầu', () => {
    assert.equal(normalizeKey('  Hà Nội  '), 'ha noi');
  });

  it('chuỗi rỗng', () => {
    assert.equal(normalizeKey(''), '');
  });
});

describe('extractHashtags', () => {
  it('tách hashtag, chữ thường, không trùng', () => {
    assert.deepEqual(extractHashtags('Đi #DaLat #dalat'), ['dalat']);
  });

  it('nhiều hashtag khác nhau', () => {
    assert.deepEqual(
      extractHashtags('Đi #DaLat #PhúQuốc #phuquoc #Sapa'),
      ['dalat', 'phuquoc', 'sapa'],
    );
  });

  it('hashtag có dấu vẫn ra không dấu', () => {
    assert.deepEqual(extractHashtags('Đi #HộiAn'), ['hoian']);
  });

  it('không có hashtag thì trả mảng rỗng', () => {
    assert.deepEqual(extractHashtags('Đi chơi thôi'), []);
  });

  it('chuỗi rỗng', () => {
    assert.deepEqual(extractHashtags(''), []);
  });
});

describe('escapeRegex', () => {
  it('escape kí tự đặc biệt để dùng trong RegExp', () => {
    // "a(b" không được làm lỗi khi new RegExp.
    const re = new RegExp(escapeRegex('a(b'));
    assert.equal(re.test('a(b'), true);
    assert.equal(re.test('ab'), false);
  });

  it('escape nhiều kí tự đặc biệt', () => {
    const re = new RegExp(escapeRegex('a.b+c*d'));
    assert.equal(re.test('a.b+c*d'), true);
    assert.equal(re.test('axbxxcxd'), false);
  });

  it('chuỗi thường không đổi', () => {
    assert.equal(escapeRegex('hoi an'), 'hoi an');
  });
});
