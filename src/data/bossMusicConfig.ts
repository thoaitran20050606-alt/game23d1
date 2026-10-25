/**
 * ============================================================================
 * TRUNG TÂM QUẢN LÝ NHẠC NỀN ĐÁNH BOSS (BOSS MUSIC CONFIG)
 * ============================================================================
 * 
 * BẠN CÓ THỂ THÊM NHẠC CHO TỪNG BOSS DỄ DÀNG BẰNG CÁC CÁCH SAU:
 * 
 * 💡 CÁCH 1 (Khuyên dùng - Để file vào thư mục):
 *    Thả file nhạc (.mp3, .wav, .ogg, .m4a) vào `src/assets/audio/` hoặc `public/assets/audio/`
 *    Sau đó chỉ cần điền tên file hoặc đường dẫn vào trường `bgm` bên dưới:
 *       bgm: 'nhac_truong.mp3'
 *       hoặc bgm: '/assets/audio/nhac_csgt.mp3'
 * 
 * 💡 CÁCH 2 (Import file trực tiếp):
 *    Thêm dòng import ở đầu file:
 *       import nhacBoss from '../assets/audio/ten_file_nhac.mp3';
 *    Sau đó gán:
 *       bgm: nhacBoss
 * 
 * 💡 CÁCH 3 (Link nhạc Online):
 *    Điền link trực tiếp tới file âm thanh:
 *       bgm: 'https://example.com/nhac_boss.mp3'
 * 
 * ----------------------------------------------------------------------------
 * DANH SÁCH CÁC TRẬN ĐÁNH BOSS TRONG GAME:
 *   1. truong:           Mini-Boss Trường trộm dép (Trường THPT Tam Phước - Màn 1)
 *   2. csgt:             Mini-Boss Trưởng Trạm CSGT Tuần Tra (Phố Huyện - Màn 2)
 *   3. baholong:         Trùm Cuối Bá Hộ Long (Đại Lộ Sài Gòn - Màn 4)
 *   4. baholong_enraged: Bá Hộ Long khi nổi điên (Cuồng nộ khi HP dưới 50%)
 * 
 * Lưu ý:
 * - Nếu để trống `bgm: ''`, game sẽ tự động phát nhạc Boss 8-bit Synth hào hùng mặc định.
 * - Nhạc sẽ tự động lặp (loop = true) và dừng khi boss bị đánh bại hoặc chuyển màn.
 * ============================================================================
 */
import Bosstruong from '../assets/audio/nhacboss/bos truong.mp3';
import csgt from '../assets/audio/nhacboss/csgt.mp3';
import Long from '../assets/audio/nhacboss/long.mp3';
import long1 from '../assets/audio/nhacboss/long1.mp3';
export interface BossMusicItem {
  id: 'truong' | 'csgt' | 'y' | 'baholong' | 'baholong_enraged';
  name: string;
  stageName: string;
  bgm: string; // <-- ĐIỀN ĐƯỜNG DẪN / TÊN FILE NHẠC TẠI ĐÂY
}

export const BOSS_MUSIC_CONFIG: Record<string, BossMusicItem> = {
  // 1. Mini-Boss Trường - Trùm Bắt Nạt Trộm Dép (THPT Tam Phước - Màn 1)
  truong: {
    id: 'truong',
    name: 'Trường (THPT Tam Phước)',
    stageName: 'Màn 1: Trường THPT Tam Phước',
    bgm: Bosstruong, // <-- Tự thêm nhạc tại đây. VD: 'nhac_truong.mp3' hoặc '/assets/audio/nhac_truong.mp3'
  },

  // 2. Mini-Boss Trưởng Trạm CSGT Tuần Tra (Phố Huyện - Màn 2)
  csgt: {
    id: 'csgt',
    name: 'Trưởng Trạm CSGT Tuần Tra',
    stageName: 'Màn 2: Phố Huyện Trạm CSGT',
    bgm: csgt, // <-- Tự thêm nhạc tại đây. VD: 'nhac_csgt.mp3' hoặc '/assets/audio/nhac_csgt.mp3'
  },

  // 3. Boss Ý - Trà Sữa & Mưa Tiền 50K (Cổng Dinh Cơ - Màn 3)
  y: {
    id: 'y',
    name: 'Boss Ý',
    stageName: 'Màn 3: Cổng Dinh Cơ - Giải Cứu Thuận',
    bgm: '', // <-- Tự thêm nhạc tại đây (VD: 'nhac_y.mp3')
  },

  // 4. Trùm Cuối Bá Hộ Long (Đại Lộ Sài Gòn - Màn 4)
  baholong: {
    id: 'baholong',
    name: 'Bá Hộ Long',
    stageName: 'Màn 4: Đại Lộ Sài Gòn',
    bgm: long1, // <-- Tự thêm nhạc tại đây. VD: 'nhac_baholong.mp3' hoặc '/assets/audio/nhac_baholong.mp3'
  },

  // 5. Bá Hộ Long Khi Nổi Điên Cuồng Nộ (Phase 2 dưới 50% HP)
  // Nếu để trống, game sẽ tự động dùng nhạc của baholong ở trên!
  baholong_enraged: {
    id: 'baholong_enraged',
    name: 'Bá Hộ Long (Cuồng Nộ Enraged)',
    stageName: 'Màn 4: Bá Hộ Long Bão Tiền & Xúc Xắc',
    bgm: Long, // <-- Tự thêm nhạc tại đây (nếu muốn bài riêng khi nổi điên)
  },
};

/**
 * Lấy đường dẫn file nhạc cho boss cụ thể
 */
export function getBossCustomBgm(bossId: string): string | undefined {
  const item = BOSS_MUSIC_CONFIG[bossId];
  if (!item || !item.bgm || typeof item.bgm !== 'string') return undefined;
  const trimmed = item.bgm.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
