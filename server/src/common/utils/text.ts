// BR13, BR16: chuẩn hoá chữ để tìm kiếm và thống kê địa điểm không bị tách "Hội An" / "hoi an".

// Đổi chuỗi có dấu tiếng Việt sang dạng không dấu (đ → d, các kí tự khác theo bảng NFD).
// Ví dụ: "Hội An" → "Hoi An", "Đà Lạt" → "Da Lat".
export function removeDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Chữ thường, bỏ dấu tiếng Việt (kể cả đ → d), gộp nhiều khoảng trắng thành một, cắt hai đầu.
// Ví dụ: "Hội   An" → "hoi an".
export function normalizeKey(s: string): string {
  return removeDiacritics(s).toLowerCase().replace(/\s+/g, ' ').trim();
}

// Tìm các #tag trong nội dung. Hỗ trợ chữ có dấu (sau khi bỏ dấu vẫn ra cùng tag).
// Trả về chữ thường, không trùng, bỏ dấu # ở đầu.
// Ví dụ: "Đi #DaLat #dalat" → ["dalat"].
export function extractHashtags(content: string): string[] {
  if (!content) return [];
  const re = /#([\p{L}\p{N}_]+)/gu;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of content.matchAll(re)) {
    const tag = normalizeKey(m[1]);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out;
}

// Escape kí tự đặc biệt của regex để đưa chuỗi người dùng gõ vào $regex an toàn.
// Ví dụ: "a(b" → "a\\(b".
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
