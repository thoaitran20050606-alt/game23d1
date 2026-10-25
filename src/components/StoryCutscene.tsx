import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Sparkles, MessageSquare, Swords, AlertTriangle, ShieldAlert } from 'lucide-react';
import portraitPhuocTrucReunited from '../assets/images/phuoc_truc_reunited_1792344680888.jpg';
import portraitPhuocGlassesTruc from '../assets/images/portrait_phuoc_glasses_truc_1792344215672.jpg';
import phuocTrucOttersImg from '../assets/images/phuoc_truc_family_otters_1792348195628.jpg';
import baHoLongVillainImg from '../assets/images/ba_ho_long_villain_1792342274333.jpg';
import baHoLongLasImg from '../assets/images/ba_ho_long_las_streetwear_1792349486434.jpg';
import phuocRealAvatarImg from '../assets/images/phuoc_real_avatar_1792344663444.jpg';
import portraitBossOfficer from '../assets/images/boss_patrol_officer_1792342260575.jpg';
import mapLevel1Img from '../assets/images/level1_song_buong_pixel_1792345673840.jpg';
import mapLevel2Img from '../assets/images/level2_pho_huyen_csgt_1792347208571.jpg';
import level4XeMayNgaImg from '../assets/images/level4_xe_may_nga_1792348181254.jpg';
import mapLevel4SaigonImg from '../assets/images/level4_saigon_night_map_1792349469369.jpg';
import {
  getPhuocAvatar,
  subscribePhuocAvatar,
  getBaHoLongAvatar,
  subscribeBaHoLongAvatar,
} from '../utils/avatarManager';
import { AvatarUploaderButton } from './AvatarUploaderButton';
import { CutsceneDialogueLine } from './CutsceneDialogueLine';
import { dialoguePlayer } from '../audio/dialoguePlayer';
import { StoryDialogueLine } from '../types/game';
import {
  CUTSCENE_INTRO_HOI1_DIALOGUES,
  CUTSCENE_INTRO_HOI2_DIALOGUES,
  CUTSCENE_INTRO_HOI3_DIALOGUES,
  CUTSCENE_INTRO_HOI4_DIALOGUES,
  CUTSCENE_LEVEL2_DIALOGUES,
  CUTSCENE_LEVEL3_TE_XE_DIALOGUES,
  CUTSCENE_LEVEL3_CONG_DINH_DIALOGUES,
  CUTSCENE_LEVEL4_TRUC_DIALOGUES,
  CUTSCENE_LEVEL4_BEFORE_BATTLE_DIALOGUES,
} from '../data/storyDialogues';

interface StoryCutsceneProps {
  onStartPlaying: () => void;
  specificScene?: 'intro' | 'level2_briefing' | 'level3_briefing' | 'level4_briefing';
}

interface CutsceneSlide {
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  badge: string;
  badgeColor?: string;
  dialogueLines?: StoryDialogueLine[];
  content: React.ReactNode;
}

export const StoryCutscene: React.FC<StoryCutsceneProps> = ({
  onStartPlaying,
  specificScene = 'intro',
}) => {
  const [phuocAvatar, setPhuocAvatarState] = useState<string>(getPhuocAvatar());
  const [baHoLongAvatar, setBaHoLongAvatarState] = useState<string>(getBaHoLongAvatar());
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const unsubPhuoc = subscribePhuocAvatar((newUrl) => setPhuocAvatarState(newUrl));
    const unsubBaHo = subscribeBaHoLongAvatar((newUrl) => setBaHoLongAvatarState(newUrl));
    return () => {
      unsubPhuoc();
      unsubBaHo();
      dialoguePlayer.stop();
    };
  }, []);

  // 1. INTRO CUTSCENE: CẢNH BÁ HỘ LONG BẮT CÔ TRÚC ĐI TRƯỚC KHI MỞ ĐẦU MÀN HÌNH 1
  const introSlides: CutsceneSlide[] = [
    {
      title: 'HỒI 1: BÌNH YÊN BÊN CẦU SÔNG BUÔNG',
      subtitle: 'Phước và Trúc bên nhau êm đềm cùng bầy rái cá thân quen',
      image: phuocTrucOttersImg,
      alt: 'Phước và Trúc vui đùa cùng rái cá bên Cầu Sông Buông',
      badge: 'CỐT TRUYỆN MỞ ĐẦU',
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/60',
      dialogueLines: CUTSCENE_INTRO_HOI1_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Bên dòng nước trong biếc của <span className="text-amber-300 font-bold">Cầu Sông Buông</span>, chàng trai{' '}
            <span className="text-emerald-300 font-bold">Phước</span> đeo kính cận hiền lành sớm tối chài lưới,
            sống cuộc đời bình dị bên người em gái <span className="text-pink-300 font-bold">Trúc</span> duyên dáng và đàn rái cá tinh nghịch.
          </p>
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl space-y-1.5 text-xs">
            {CUTSCENE_INTRO_HOI1_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine key={idx} line={line} />
            ))}
          </div>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Tùy chỉnh avatar nhân vật chính:</span>
            <AvatarUploaderButton target="phuoc" variant="compact" />
          </div>
        </div>
      ),
    },
    {
      title: 'HỒI 2: BÁ HỘ LONG BẤT NGỜ XUẤT HIỆN CẬY GIÀU ÉP DUYÊN',
      subtitle: 'Phú hộ trẻ vênh váo vung tiền đòi chiếm đoạt cô Trúc',
      image: baHoLongVillainImg,
      alt: 'Bá Hộ Long xuất hiện',
      badge: 'KẺ PHẢN DIỆN XUẤT HIỆN',
      badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/60',
      dialogueLines: CUTSCENE_INTRO_HOI2_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Bất thình lình, tiếng còi xe inh ỏi vang dội đầu cầu. <span className="text-purple-300 font-bold">Bá Hộ Long</span> – tay phú hộ trẻ tuổi khét tiếng giàu xổi cậy quyền – nghênh ngang bước xuống với bộ mặt trơ trẽn.
          </p>
          <div className="bg-purple-950/40 border border-purple-500/30 p-2.5 rounded-xl space-y-1.5 text-xs">
            {CUTSCENE_INTRO_HOI2_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine key={idx} line={line} />
            ))}
          </div>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Tùy chỉnh avatar Bá Hộ Long:</span>
            <AvatarUploaderButton target="baholong" variant="compact" />
          </div>
        </div>
      ),
    },
    {
      title: 'HỒI 3: CẢNH BÁ HỘ LONG BẮT CÔ TRÚC ĐI!',
      subtitle: 'Long nổi điên hạ lệnh bắt trói Trúc ném lên xe, kích động rái cá cản đường Phước',
      image: baHoLongLasImg,
      alt: 'Bá Hộ Long bắt cô Trúc đi',
      badge: 'BIẾN CỐ BẮT CÓC KỊCH TÍNH',
      badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-950/70',
      dialogueLines: CUTSCENE_INTRO_HOI3_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-rose-300 leading-relaxed font-semibold">
            Bị Trúc cự tuyệt thẳng thừng trước mặt đám tùy tùng, Bá Hộ Long thẹn quá hóa giận, lộ rõ bản chất côn đồ bạo ngược!
          </p>
          <div className="bg-rose-950/50 border border-rose-500/40 p-2.5 rounded-xl space-y-1.5 text-xs">
            {CUTSCENE_INTRO_HOI3_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine key={idx} line={line} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'HỒI 4: LỜI THỀ GIẢI CỨU & XUẤT TRẬN VƯỢT SÔNG BUÔNG',
      subtitle: 'Phước quyết tâm đạp rái cá vượt Cầu Sông Buông, dùng lý lẽ "BECAUSE" giải cứu Trúc!',
      image: phuocRealAvatarImg,
      alt: 'Quyết tâm của Phước',
      badge: 'LÊN ĐƯỜNG XUẤT TRẬN',
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/60',
      dialogueLines: CUTSCENE_INTRO_HOI4_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Bá Hộ Long rồ ga xe máy cuốn theo bụi mù mịt, chở cô Trúc đang khóc thét chạy về hướng Phố Huyện. Phước siết chặt nắm đấm, ngọn lửa chính nghĩa bừng sáng!
          </p>
          <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl text-xs space-y-1.5">
            {CUTSCENE_INTRO_HOI4_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine
                key={idx}
                line={line}
                badgeClassName="bg-amber-500/30 text-amber-200 border-amber-500/50"
                textClassName="text-amber-100 font-bold text-sm"
              />
            ))}
          </div>
          <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px] text-stone-300 space-y-1">
            <p className="text-emerald-400 font-bold">🎮 HƯỚNG DẪN MÀN 1:</p>
            <p>• Dùng <strong>A / D hoặc Mũi Tên</strong> để di chuyển, <strong>Space / W</strong> để nhảy.</p>
            <p>• Nhảy đạp lên đầu rái cá để nảy cao vượt chướng ngại vật.</p>
            <p>• Nhấn <strong>F hoặc Chuột Trái</strong> để hô <strong>"BECAUSE!"</strong> đánh lùi rái cá từ xa!</p>
            <p>• Nhặt sen vàng và <strong>Trái Tim ❤️</strong> để hồi máu và cộng thêm thời gian!</p>
          </div>
        </div>
      ),
    },
  ];

  // 2. LEVEL 2 BRIEFING: Chạm trán Mini-Boss CSGT tại Phố Huyện
  const level2Slides: CutsceneSlide[] = [
    {
      title: 'CỬA ẢI PHỐ HUYỆN: CHẠM TRÁN TRƯỞNG TRẠM CSGT',
      subtitle: 'Đối thoại nảy lửa với Công An & Phản đòn bằng lý lẽ "BECAUSE"!',
      image: mapLevel2Img,
      alt: 'Phố Huyện và Trạm CSGT',
      badge: 'CHẠM TRÁN BOSS CÔNG AN',
      badgeColor: 'border-sky-500/40 text-sky-300 bg-sky-950/60',
      dialogueLines: CUTSCENE_LEVEL2_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Phước đã vượt qua Cầu Sông Buông và đuổi tới <span className="text-amber-300 font-bold">Phố Huyện</span>.
            Ngay trước trạm kiểm soát, viên Sĩ Quan CSGT tuần tra tay lăm lăm súng ngắn nghiêm khắc chặn đường!
          </p>
          <div className="bg-sky-950/40 border border-sky-500/30 p-2.5 rounded-xl space-y-1.5 text-xs">
            {CUTSCENE_LEVEL2_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine key={idx} line={line} />
            ))}
          </div>
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-rose-300">
              <AlertTriangle className="w-4 h-4" />
              CƠ CHẾ BOSS CÔNG AN:
            </p>
            <p>• Boss có súng lục bắn đạn liên thanh! Hãy nhảy né hoặc leo lên giàn giáo.</p>
            <p>• Nhấn <strong>Chuột Trái hoặc phím F</strong> để hô <strong>"BECAUSE!"</strong> (hồi chiêu 2.5s) phản đòn.</p>
            <p>• Khi Boss xuống <strong>50% HP</strong>, Boss sẽ <strong>HÓA ĐIÊN TỔNG LỰC</strong> bắn đạn chùm 3 viên liên tiếp!</p>
          </div>
        </div>
      ),
    },
  ];

  // 3. LEVEL 3 BRIEFING: CẢNH MỞ ĐẦU MÀN HÌNH 3 LÀ CẢNH TÉ XE MÁY TRÊN DẢI PHÂN CÁCH
  const level3Slides: CutsceneSlide[] = [
    {
      title: 'MÀN 3: CẢNH TÉ XE MÁY TRÊN DẢI PHÂN CÁCH',
      subtitle: 'Bá Hộ Long phóng bạt mạng trượt bánh lộn 3 vòng đâm vào dải phân cách!',
      image: level4XeMayNgaImg,
      alt: 'Xe máy của Bá Hộ Long lật nhào bên dải phân cách',
      badge: 'CẢNH MỞ ĐẦU MÀN 3: TÉ XE MÁY DẢI PHÂN CÁCH',
      badgeColor: 'border-amber-500/50 text-amber-300 bg-amber-950/70',
      dialogueLines: CUTSCENE_LEVEL3_TE_XE_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Sau khi được chú CSGT cho mượn xe máy tuần tra đặc chủng, Phước đã vít ga truy đuổi sát nút tên phú hộ!
            Đến đoạn cua ngặt nghèo trên dải phân cách cao tốc, chiếc xe máy của Long phóng quá tốc độ, nổ lốp trượt bánh lật nhào 3 vòng cày nát dải phân cách!
          </p>
          <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl space-y-1.5 text-xs">
            {CUTSCENE_LEVEL3_TE_XE_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine key={idx} line={line} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'MÀN 3: ĐỘT NHẬP CỔNG DINH BÁ HỘ LONG',
      subtitle: 'Vượt bẫy đầm sen gai góc, leo mái ngói & phá vỡ phòng tuyến rái cá',
      image: baHoLongAvatar,
      alt: 'Cổng Dinh Bá Hộ Long',
      badge: 'ĐỘT KÍCH CỔNG DINH',
      badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/60',
      dialogueLines: CUTSCENE_LEVEL3_CONG_DINH_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Dù chiếc xe máy bị lật nát bên dải phân cách, Bá Hộ Long đã kịp trốn vào khuôn viên cổng dinh,
            nơi được bố trí dày đặc bè bèo di động qua đầm sen sâu và những chú rái cá hộ vệ trang bị kiếm thuật.
          </p>
          <div className="bg-pink-950/40 border border-pink-500/30 p-2 rounded-xl text-xs space-y-1">
            {CUTSCENE_LEVEL3_CONG_DINH_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine key={idx} line={line} />
            ))}
          </div>
          <div className="bg-amber-950/50 border border-amber-500/40 p-3 rounded-xl text-xs text-amber-200 space-y-1">
            <p className="font-bold">💡 Mẹo vượt ải:</p>
            <p>• Canh thời gian nhảy qua các bè bèo nổi trên đầm sen.</p>
            <p>• Dùng tiếng hô <strong>"BECAUSE!"</strong> để làm choáng lính rái cá nhảy chồm từ xa.</p>
            <p>• Nhặt <strong>Trái Tim ❤️</strong> trên mái ngói đỏ để tăng máu và thêm thời gian!</p>
          </div>
        </div>
      ),
    },
  ];

  // 4. LEVEL 4 BRIEFING: Màn cuối tại Đại Lộ Sài Gòn Đêm trước khi đại chiến sinh tử
  const level4Slides: CutsceneSlide[] = [
    {
      title: 'HỒI CUỐI: ĐẠI LỘ SÀI GÒN ĐÊM - LONG HẾT ĐƯỜNG CHẠY',
      subtitle: 'Phước dồn Bá Hộ Long vào đường cùng dưới ánh đèn Landmark 81 & Bitexco!',
      image: mapLevel4SaigonImg,
      alt: 'Đại lộ Sài Gòn đêm lung linh ánh đèn',
      badge: 'QUYẾT CHIẾN ĐỈNH CAO',
      badgeColor: 'border-indigo-500/40 text-indigo-300 bg-indigo-950/60',
      dialogueLines: CUTSCENE_LEVEL4_TRUC_DIALOGUES,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Vượt qua toàn bộ bẫy chông và lính gác của Dinh Cơ, Phước đã truy đuổi dồn <span className="text-purple-300 font-bold">Bá Hộ Long</span> tới tận{' '}
            <span className="text-amber-300 font-bold">Đại Lộ Sài Gòn Đêm</span> – nơi tòa tháp Landmark 81 và Bitexco sừng sững bên dòng sông đêm lung linh.
          </p>
          <p className="text-xs text-stone-300 leading-relaxed">
            Hết đường tháo chạy, Bá Hộ Long quay ngoắt lại, mắt đỏ ngầu, tay nắm chặt vũ khí tối thượng là xúc xắc ma thuật và những bao tiền dày cộp!
          </p>
          <div className="bg-pink-950/40 border border-pink-500/30 p-2 rounded-xl text-xs">
            {CUTSCENE_LEVEL4_TRUC_DIALOGUES.map((line, idx) => (
              <CutsceneDialogueLine key={idx} line={line} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'ĐỐI THOẠI TRƯỚC TRẬN ĐẠI CHIẾN: PHƯỚC VS BÁ HỘ LONG',
      subtitle: 'Cuộc tranh cãi nảy lửa giữa lý lẽ tình yêu chân thành và sức mạnh đồng tiền',
      image: baHoLongVillainImg,
      alt: 'Bá Hộ Long tử chiến',
      badge: 'ĐỐI THOẠI TRƯỚC GIỜ G',
      badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-950/70',
      dialogueLines: CUTSCENE_LEVEL4_BEFORE_BATTLE_DIALOGUES,
      content: (
        <div className="space-y-2">
          {CUTSCENE_LEVEL4_BEFORE_BATTLE_DIALOGUES.map((line, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl border text-xs ${
                line.role === 'phuoc'
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : 'bg-purple-950/40 border-purple-500/40'
              }`}
            >
              <CutsceneDialogueLine line={line} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'QUYẾT TỬ ĐẠI LỘ: CẢNH BÁO BÁ HỘ LONG HÓA ĐIÊN 50% HP',
      subtitle: 'Xúc xắc nảy & Bão tiền đô la – Phản đòn bằng tiếng hô "BECAUSE!"',
      image: baHoLongLasImg,
      alt: 'Bá Hộ Long Streetwear LAS',
      badge: 'CƠ CHẾ BOSS CHI TIẾT',
      badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-950/70',
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 space-y-1 text-rose-200">
            <p className="font-extrabold flex items-center gap-1.5 text-rose-300 text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              CẢNH BÁO: BÁ HỘ LONG SẼ HÓA ĐIÊN KHI XUỐNG 50% HP!
            </p>
            <p>• <strong>Bình thường:</strong> Ném cặp xúc xắc nảy và phóng bão tiền đô la $100.</p>
            <p>• <strong>Khi xuống còn 50% HP (Hóa Điên / Cuồng Nộ):</strong></p>
            <p className="pl-3 text-amber-200">🔥 Aura lửa đỏ cuồng bạo quanh người, tốc độ di chuyển tăng gấp đôi.</p>
            <p className="pl-3 text-amber-200">🔥 Tung bão 3 xúc xắc liên hoàn với vận tốc cực nhanh khó né.</p>
            <p className="pl-3 text-amber-200">🔥 Phóng lốc xoáy 5 đợt tiền đô la và xấp tiền dày đặc.</p>
            <p className="pl-3 text-amber-200">🔥 Giậm đất tạo DOUBLE 4 sóng xung kích bùng nổ sang 2 bên!</p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 space-y-1">
            <p className="font-bold">🗣️ VŨ KHÍ DUY NHẤT CỦA PHƯỚC: "BECAUSE!" (Hồi chiêu 2.5 giây)</p>
            <p>Canh thời điểm né đòn, hô vang <strong>"BECAUSE!"</strong> để phá bão tiền và đánh gục Bá Hộ Long cứu Trúc!</p>
          </div>
        </div>
      ),
    },
  ];

  let slides = introSlides;
  if (specificScene === 'level2_briefing') slides = level2Slides;
  else if (specificScene === 'level3_briefing') slides = level3Slides;
  else if (specificScene === 'level4_briefing') slides = level4Slides;

  // Auto-play primary dialogue audio on slide transition
  useEffect(() => {
    const activeSlide = slides[currentSlide];
    if (activeSlide && activeSlide.dialogueLines && activeSlide.dialogueLines.length > 0) {
      dialoguePlayer.play(activeSlide.dialogueLines[0]);
    }
    return () => {
      dialoguePlayer.stop();
    };
  }, [currentSlide, specificScene]);

  const handleNext = () => {
    dialoguePlayer.stop();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onStartPlaying();
    }
  };

  const handleSkip = () => {
    dialoguePlayer.stop();
    onStartPlaying();
  };

  const active = slides[currentSlide];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 md:p-6 bg-stone-950/95 backdrop-blur-md z-30 select-none">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
        {/* Left Side: Story & Character Artwork */}
        <div className="relative w-full md:w-5/12 h-56 md:h-auto min-h-[260px] md:min-h-[420px] bg-stone-950 flex items-center justify-center overflow-hidden p-3 shrink-0">
          <img
            src={active.image}
            alt={active.alt}
            className="w-full h-full object-contain max-h-[380px] drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-stone-900/30 pointer-events-none" />
        </div>

        {/* Right Side: Narrative & Dialogue Flow */}
        <div className="w-full md:w-7/12 p-5 md:p-7 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold flex items-center gap-1.5 ${
                  active.badgeColor || 'border-amber-500/40 text-amber-400 bg-amber-950/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {active.badge || 'CỐT TRUYỆN TRANH'}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-black text-stone-100 tracking-tight mb-1">
              {active.title}
            </h2>
            <p className="text-xs text-stone-400 mb-3">{active.subtitle}</p>

            <div className="text-stone-300 text-sm leading-relaxed">{active.content}</div>
          </div>

          {/* Action Row */}
          <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between shrink-0">
            <button
              onClick={handleSkip}
              className="text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer py-1.5 px-2"
            >
              Bỏ qua giới thiệu
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs md:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{currentSlide < slides.length - 1 ? 'Tiếp theo' : 'Vào Màn Chơi'}</span>
              {currentSlide < slides.length - 1 ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
