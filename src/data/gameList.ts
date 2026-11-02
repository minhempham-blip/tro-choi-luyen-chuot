import { GameMetadata } from '../state/types';

export const GAME_LIST: GameMetadata[] = [
  // --- NHÓM A: DI CHUYỂN VÀ CHỈ CHUỘT (HOVER) ---
  {
    id: 1,
    title: 'Cây đũa phép nhiệm màu',
    groupKey: 'A_hover',
    groupName: 'Nhóm A: Di chuyển chuột',
    actionType: 'hover',
    actionLabel: 'Di chuyển chuột (không bấm)',
    description: 'Cầm cây đũa phép thần kỳ, rê chuột lướt nhẹ qua những nụ hoa và đám mây cổ tích để thắp sáng xứ sở diệu kỳ!',
    detailedTutorial: 'Em hãy cầm chuột nhẹ nhàng và rê con trỏ lướt qua từng nụ hoa, đám mây hay tinh tú để thắp sáng chúng. Không cần bấm nút chuột nào cả nhé!',
    hintTiers: {
      tier1: 'Mũi tên vàng đang chỉ vào mục tiêu cần thắp sáng kìa, em hãy rê chuột lướt qua nhé!',
      tier2: 'Bé chỉ cần rê chuột lướt nhẹ qua mục tiêu, đừng bấm nút chuột nhé!',
      tier3: 'Xem mẫu: chuột tự động lướt nhẹ qua mục tiêu để thắp sáng phép thuật!'
    },
    targetMouseButton: 'move'
  },
  {
    id: 2,
    title: 'Ong vàng chăm chỉ',
    groupKey: 'A_hover',
    groupName: 'Nhóm A: Di chuyển chuột',
    actionType: 'hover',
    actionLabel: 'Rê chuột dẫn lối chú ong',
    description: 'Rê chuột nhẹ nhàng dẫn chú ong vàng tí hon bay lượn theo cung đường hoa nở rộ để hút từng giọt mật thơm ngon mang về tổ.',
    detailedTutorial: 'Em hãy di chuyển chuột thật mượt mà để dẫn chú ong bay lướt qua các đóa hoa rực rỡ và hút giọt mật ngọt. Không cần bấm nút chuột nào nhé!',
    hintTiers: {
      tier1: 'Mũi tên vàng đang chỉ vào đóa hoa tiếp theo kìa, em hãy rê chuột dẫn chú ong bay tới nhé!',
      tier2: 'Di chuyển chuột thật êm ái để chú ong vỗ cánh lướt qua từng đóa hoa hút mật ngọt nhé!',
      tier3: 'Xem chú ong mẫu mở đường: rê chuột uốn lượn mượt mà theo cung đường hoa!'
    },
    targetMouseButton: 'move'
  },
  {
    id: 3,
    title: 'Đom đóm hoàng hôn',
    groupKey: 'A_hover',
    groupName: 'Nhóm A: Di chuyển chuột',
    actionType: 'hover',
    actionLabel: 'Di chuyển chuột đuổi bắt',
    description: 'Di chuyển vòng sáng của chiếc đèn lồng để soi và bắt những chú đom đóm rực rỡ.',
    detailedTutorial: 'Em hãy rê chuột để di chuyển quầng sáng của chiếc đèn lồng trùm lên chú đom đóm đang bay lượn.',
    hintTiers: {
      tier1: 'Có một chú đom đóm sáng lung linh ngay chỗ mũi tên kìa!',
      tier2: 'Đưa vòng sáng của đèn lồng chạm vào đom đóm trong 1 giây nhé!',
      tier3: 'Rê chuột đón đầu hướng bay của chú đom đóm!'
    },
    targetMouseButton: 'move'
  },
  {
    id: 4,
    title: 'Phi thuyền thám hiểm vũ trụ',
    groupKey: 'A_hover',
    groupName: 'Nhóm A: Di chuyển chuột',
    actionType: 'hover',
    actionLabel: 'Rê chuột lái phi thuyền',
    description: 'Rê chuột nhẹ nhàng để lái phi thuyền không gian lướt qua các cổng sao ngân hà theo thứ tự 1 → 2 → 3… và thu thập đá quý vũ trụ.',
    detailedTutorial: 'Em hãy di chuyển chuột để phi thuyền bay xuyên qua các cổng sao đang phát sáng theo đúng thứ tự số (không cần bấm nút chuột nhé!).',
    hintTiers: {
      tier1: 'Cổng sao tiếp theo đang xoay tròn phát sáng kìa, em hãy lái phi thuyền tới đó nhé!',
      tier2: 'Di chuyển chuột thật êm để phi thuyền lướt qua đúng tâm cổng sao số tiếp theo!',
      tier3: 'Xem phi thuyền mẫu mở đường: bay qua các cổng sao thật mượt mà!'
    },
    targetMouseButton: 'move'
  },

  // --- NHÓM B: NHÁY CHUỘT TRÁI (CLICK) ---
  {
    id: 5,
    title: 'Cung thủ tí hon – Bắn bia hoa quả',
    groupKey: 'B_click',
    groupName: 'Nhóm B: Nháy chuột trái',
    actionType: 'click',
    actionLabel: 'Nháy chuột trái ngắm bắn',
    description: 'Em hóa thân thành cung thủ tí hon, rê chuột ngắm chuẩn và nháy chuột trái để bắn trúng bia rơm và những quả hoa quả ngọt ngào!',
    detailedTutorial: 'Em di chuyển chuột để hướng tâm ngắm vào bia rơm hoặc quả hoa quả, sau đó dùng ngón trỏ nháy nút chuột trái 1 lần thật dứt khoát để bắn tên nhé!',
    hintTiers: {
      tier1: 'Mũi tên vàng đang chỉ vào mục tiêu gần nhất, em hãy nháy chuột trái vào đó nhé!',
      tier2: 'Nháy nút chuột trái 1 lần khi tâm ngắm đã nằm gọn trên quả hoa quả!',
      tier3: 'Xem mẫu: chuột tự động rê tới quả hoa quả và nháy nút trái làm vỡ mục tiêu!'
    },
    targetMouseButton: 'left'
  },
  {
    id: 6,
    title: 'Chuột chũi tinh nghịch',
    groupKey: 'B_click',
    groupName: 'Nhóm B: Nháy chuột trái',
    actionType: 'click',
    actionLabel: 'Nháy chuột trái chính xác',
    description: 'Nháy nhanh vào chú chuột chũi vừa ngoi lên. Nhớ đừng bấm nhầm chú thỏ dễ thương nhé!',
    detailedTutorial: 'Khi chú chuột chũi nhô đầu lên khỏi miệng hang, em hãy nhanh tay nháy chuột trái vào chú chuột chũi nhé!',
    hintTiers: {
      tier1: 'Chú chuột chũi vừa ngoi lên ở cái hang này nè!',
      tier2: 'Chỉ nháy chuột trái vào chuột chũi nâu thôi, đừng bấm chú thỏ trắng nhé!',
      tier3: 'Quan sát hang đất, khi chuột ngoi lên hãy bấm nút trái ngay!'
    },
    targetMouseButton: 'left'
  },
  {
    id: 7,
    title: 'Tiệm bánh ngọt diệu kỳ',
    groupKey: 'B_click',
    groupName: 'Nhóm B: Nháy chuột trái',
    actionType: 'click',
    actionLabel: 'Nháy chuột trái có quan sát',
    description: 'Hóa thân thành đầu bếp nhí hoàng gia, nháy chuột trái chọn đúng món bánh ngọt theo đơn hàng và tránh xa các món cay khét nhé.',
    detailedTutorial: 'Em hãy đọc yêu cầu ở bảng thực đơn, rồi nháy chuột trái dứt khoát vào chiếc bánh ngọt yêu cầu. Bỏ qua ớt cay và bánh khét nhé!',
    hintTiers: {
      tier1: 'Mũi tên vàng đang chỉ vào chiếc bánh ngọt thơm phức cần bấm kìa!',
      tier2: 'Em hãy nháy chuột trái một lần vào chiếc bánh ngọt đang phát sáng theo yêu cầu nhé!',
      tier3: 'Xem mẫu: di chuột đến chiếc bánh ngọt rồi nháy nhẹ chuột trái một cái!'
    },
    targetMouseButton: 'left'
  },
  {
    id: 8,
    title: 'Bắn pháo hoa rực rỡ',
    groupKey: 'B_click',
    groupName: 'Nhóm B: Nháy chuột trái',
    actionType: 'click',
    actionLabel: 'Nháy chuột trái bắn pháo hoa',
    description: 'Nháy chuột trái vào những quả pháo đang bay lên để thắp sáng bầu trời đêm với muôn ngàn ánh sao!',
    detailedTutorial: 'Em hãy rê chuột và nháy nút trái vào quả pháo hoa đang bay lên để ngắm nhìn pháo hoa nổ tung tuyệt đẹp nhé!',
    hintTiers: {
      tier1: 'Mũi tên đang chỉ vào quả pháo hoa đang bay lên kìa!',
      tier2: 'Em nháy chuột trái vào quả pháo hoa để tạo chùm sáng rực rỡ nhé!',
      tier3: 'Xem mẫu: đặt con trỏ lên quả pháo hoa rồi nháy chuột trái một cái!'
    },
    targetMouseButton: 'left'
  },
  {
    id: 9,
    title: 'Phím đàn thần kỳ',
    groupKey: 'B_click',
    groupName: 'Nhóm B: Nháy chuột trái',
    actionType: 'click',
    actionLabel: 'Nháy chuột trái chơi đàn theo nhịp',
    description: 'Hóa thân thành nhạc trưởng tí hon, nháy chuột trái vào các phím đàn cầu vồng phát sáng để cùng dàn nhạc thú cưng tấu lên giai điệu tuyệt đẹp!',
    detailedTutorial: 'Em hãy nhìn nốt nhạc phát sáng trên khuông nhạc và phím đàn, rồi nháy chuột trái vào đúng phím đàn của bạn thú cưng để phát ra âm thanh du dương nhé!',
    hintTiers: {
      tier1: 'Mũi tên vàng đang chỉ vào phím đàn phát sáng, em hãy nháy chuột trái vào đó nhé!',
      tier2: 'Bé nháy chuột trái vào đúng phím đàn nốt nhạc đang sáng để bạn thú nhảy múa nào!',
      tier3: 'Xem mẫu: chuột tự rê đến phím đàn và nháy chuột trái gõ nốt nhạc mẫu!'
    },
    targetMouseButton: 'left'
  },

  // --- NHÓM C: NHÁY ĐÚP CHUỘT (DOUBLE-CLICK) ---
  {
    id: 10,
    title: 'Giải cứu thú cưng pha lê',
    groupKey: 'C_dblclick',
    groupName: 'Nhóm C: Nháy đúp chuột',
    actionType: 'dblclick',
    actionLabel: 'Nháy đúp chuột (Tách - Tách)',
    description: 'Nháy đúp chuột hai lần thật nhanh vào quả cầu pha lê lấp lánh để phá vỡ lớp vỏ pha lê và giải cứu các bạn thú cưng đáng yêu!',
    detailedTutorial: 'Em dùng ngón trỏ gõ nút chuột trái hai lần thật nhanh liên tiếp ("tách-tách") vào quả cầu pha lê. Nếu bấm chậm quá thì vết nứt sẽ tự liền lại đấy!',
    hintTiers: {
      tier1: 'Quả cầu pha lê đang phát sáng nhấp nháy, em hãy nháy đúp 2 lần nhanh vào đó nhé!',
      tier2: 'Bấm ngón trỏ 2 lần liên tục thật nhanh: tách-tách để làm vỡ quả cầu!',
      tier3: 'Xem mẫu: chuột tự động rê tới quả cầu và nháy đúp 2 lần giải cứu bạn thú!'
    },
    targetMouseButton: 'left-double'
  },
  {
    id: 11,
    title: 'Mở cửa sổ bí mật',
    groupKey: 'C_dblclick',
    groupName: 'Nhóm C: Nháy đúp chuột',
    actionType: 'dblclick',
    actionLabel: 'Nháy đúp chuột mở cánh cửa',
    description: 'Nháy đúp chuột vào cánh cửa sổ ngôi nhà gỗ để mở toang cửa đón những người bạn ngộ nghĩnh.',
    detailedTutorial: 'Em hãy nháy đúp chuột (bấm nút trái 2 lần thật nhanh) vào từng cánh cửa sổ đóng kín để mở cửa nhé!',
    hintTiers: {
      tier1: 'Cánh cửa sổ này đang chờ em mở kìa!',
      tier2: 'Nháy đúp chuột trái hai lần liền tay vào ô cửa sổ nhé!',
      tier3: 'Rê chuột vào giữa cánh cửa và gõ hai nhịp nhanh "tách-tách"!'
    },
    targetMouseButton: 'left-double'
  },
  {
    id: 12,
    title: 'Đào tìm kho báu',
    groupKey: 'C_dblclick',
    groupName: 'Nhóm C: Nháy đúp chuột',
    actionType: 'dblclick',
    actionLabel: 'Nháy đúp chuột đào bới',
    description: 'Nháy đúp vào các ụ đất để cuốc đất tìm rương kho báu vàng lấp lánh.',
    detailedTutorial: 'Em hãy nháy đúp chuột hai lần nhanh vào ụ đất để đào lên. Nhớ nhặt rương vàng và tránh hòn đá tảng nhé!',
    hintTiers: {
      tier1: 'Ụ đất có dấu sao lấp lánh đang có kho báu kìa!',
      tier2: 'Bấm nhanh hai lần nút chuột trái vào ô đất để đào kho báu!',
      tier3: 'Đưa chuột đến ụ đất rồi nháy đúp hai lần dứt khoát!'
    },
    targetMouseButton: 'left-double'
  },

  // --- NHÓM D: NHÁY CHUỘT PHẢI (RIGHT-CLICK) ---
  {
    id: 13,
    title: 'Vòng phép thuật biến hình',
    groupKey: 'D_rightclick',
    groupName: 'Nhóm D: Nháy chuột phải',
    actionType: 'rightclick',
    actionLabel: 'Nháy chuột phải (ngón giữa)',
    description: 'Nhập vai phù thủy tí hon, nháy chuột phải vào đồ vật để mở vòng tròn bùa chú huyền bí, rồi chọn bùa phép biến hóa thần kỳ!',
    detailedTutorial: 'Em dùng ngón giữa bấm vào nút chuột bên phải lên đồ vật để triệu hồi vòng tròn phép thuật, sau đó nháy chuột trái chọn đúng bùa chú yêu cầu nhé!',
    hintTiers: {
      tier1: 'Mũi tên vàng đang chỉ vào đồ vật kìa, em hãy dùng ngón giữa nháy chuột phải vào đó nhé!',
      tier2: 'Bấm nút chuột bên phải một cái để mở vòng tròn bùa chú, rồi bấm chuột trái chọn phép nhé!',
      tier3: 'Xem mẫu: chuột tự rê tới đồ vật, nháy chuột phải mở vòng phép rồi chọn bùa chú biến hình!'
    },
    targetMouseButton: 'right'
  },
  {
    id: 14,
    title: 'Hộp quà bí mật',
    groupKey: 'D_rightclick',
    groupName: 'Nhóm D: Nháy chuột phải',
    actionType: 'rightclick',
    actionLabel: 'Nháy chuột phải chọn menu',
    description: 'Nháy chuột phải vào hộp quà sinh nhật rực rỡ để hiện menu, rồi chọn mục "Mở quà".',
    detailedTutorial: 'Em hãy nháy chuột phải vào hộp quà để làm hiện bảng chọn, rồi nháy chuột trái vào dòng "Mở quà" để khám phá món quà!',
    hintTiers: {
      tier1: 'Nháy nút chuột phải lên chiếc nơ của hộp quà!',
      tier2: 'Sau khi bấm chuột phải, em bấm chuột trái vào chữ "Mở quà" nhé!',
      tier3: 'Nháy chuột phải vào hộp quà → Bấm nút "Mở quà" trên menu!'
    },
    targetMouseButton: 'right'
  },

  // --- NHÓM E: KÉO VÀ THẢ (DRAG & DROP) ---
  {
    id: 15,
    title: 'Dọn đồ vào tủ',
    groupKey: 'E_drag',
    groupName: 'Nhóm E: Kéo và thả',
    actionType: 'drag',
    actionLabel: 'Nhấn giữ và kéo thả',
    description: 'Nhấn giữ chuột trái vào đồ chơi, sách, áo rồi kéo và thả vào đúng ngăn tủ gọn gàng.',
    detailedTutorial: 'Em bấm giữ nút chuột trái lên món đồ, kéo chuột di chuyển món đồ vào ngăn tủ, rồi thả tay ra để cất nhé!',
    hintTiers: {
      tier1: 'Mũi tên chỉ đường kéo món đồ này vào ngăn tủ đúng loại kìa!',
      tier2: 'Nhấn giữ nút chuột trái, đừng thả tay vội, kéo tới ngăn tủ rồi mới buông tay!',
      tier3: 'Kéo chú gấu bông vào ngăn đồ chơi và thả tay ra nào!'
    },
    targetMouseButton: 'drag'
  },
  {
    id: 16,
    title: 'Cho thú cưng ăn',
    groupKey: 'E_drag',
    groupName: 'Nhóm E: Kéo và thả',
    actionType: 'drag',
    actionLabel: 'Kéo thức ăn cho bé thú',
    description: 'Kéo đĩa cá cho mèo con, khúc xương cho cún cưng và củ cà rốt cho thỏ trắng nhé!',
    detailedTutorial: 'Em hãy nhấn giữ chuột trái vào món ăn, kéo đến miệng bạn thú thích ăn món đó rồi buông tay ra nhé!',
    hintTiers: {
      tier1: 'Kéo món ăn này đến bạn thú đang nhấp nháy phát sáng nhé!',
      tier2: 'Mèo con thích ăn cá, cún thích gặm xương, còn thỏ thích cà rốt nè!',
      tier3: 'Nhấn giữ món cá, kéo thẳng đến chỗ bạn mèo rồi thả nút chuột ra!'
    },
    targetMouseButton: 'drag'
  },
  {
    id: 17,
    title: 'Ghép tranh vui nhộn',
    groupKey: 'E_drag',
    groupName: 'Nhóm E: Kéo và thả',
    actionType: 'drag',
    actionLabel: 'Kéo mảnh ghép vào vị trí',
    description: 'Kéo các mảnh ghép tranh đặt vào đúng vị trí trên khung để hoàn thành bức tranh rực rỡ.',
    detailedTutorial: 'Em hãy nhấn giữ từng mảnh ghép bên ngoài, kéo vào ô có hình mờ tương ứng trong khung rồi thả tay ra nhé!',
    hintTiers: {
      tier1: 'Mảnh ghép này khớp với ô viền vàng đang sáng nhấp nháy kìa!',
      tier2: 'Nhìn hình dạng và màu sắc của mảnh ghép rồi kéo vào đúng ô nhé!',
      tier3: 'Kéo mảnh ghép này đặt thẳng vào ô góc trên bên trái nè!'
    },
    targetMouseButton: 'drag'
  },
  {
    id: 18,
    title: 'Kéo chọn quả ngọt',
    groupKey: 'E_drag',
    groupName: 'Nhóm E: Kéo chọn vùng',
    actionType: 'select',
    actionLabel: 'Kéo chuột tạo khung chọn',
    description: 'Nhấn giữ chuột và kéo tạo khung chữ nhật để bao quanh tất cả các quả dâu tây ngọt ngào.',
    detailedTutorial: 'Em hãy nhấn giữ chuột ở một góc, kéo chuột chéo sang góc đối diện để tạo khung bao bọc các quả yêu cầu rồi thả tay ra!',
    hintTiers: {
      tier1: 'Khung mờ nhấp nháy chỉ vùng em cần kéo chuột từ góc này sang góc kia!',
      tier2: 'Nhấn giữ nút chuột từ ngoài và kéo một ô vuông trùm hết các quả dâu nhé!',
      tier3: 'Bấm giữ chuột ở góc trên trái, kéo xéo xuống góc dưới phải rồi thả tay!'
    },
    targetMouseButton: 'drag'
  },

  // --- NHÓM F: CON LĂN CHUỘT VÀ TỔNG HỢP ---
  {
    id: 19,
    title: 'Tàu lặn thám hiểm đại dương',
    groupKey: 'F_special',
    groupName: 'Nhóm F: Con lăn & Tổng hợp',
    actionType: 'wheel',
    actionLabel: 'Cuộn con lăn chuột lặn sâu',
    description: 'Lăn bánh xe chuột xuống dưới để tàu lặn sâu xuống đáy biển, lăn lên trên để nổi lên và khám phá các sinh vật biển bí ẩn.',
    detailedTutorial: 'Em dùng ngón trỏ cuộn bánh xe ở giữa lưng chuột xuống dưới để lặn sâu, hoặc cuộn lên trên để nổi lên đến đúng độ sâu của các sinh vật và rương kho báu nhé! (Hoặc bấm các nút Nổi lên / Lặn sâu trên màn hình)',
    hintTiers: {
      tier1: 'Mũi tên chỉ hướng cuộn con lăn chuột kìa, em hãy lăn chuột theo hướng đó nhé!',
      tier2: 'Lăn con lăn chuột xuống để tàu ngầm lặn sâu tới đúng cự ly mục tiêu nhé!',
      tier3: 'Tàu lặn đang tự căn chỉnh độ sâu tới mục tiêu, em hãy bấm nút Chụp ảnh khi tới nơi nhé!'
    },
    targetMouseButton: 'wheel'
  },
  {
    id: 20,
    title: 'Nhà vô địch chuột',
    groupKey: 'F_special',
    groupName: 'Nhóm F: Con lăn & Tổng hợp',
    actionType: 'click',
    actionLabel: 'Thử thách tổng hợp toàn năng',
    description: 'Vượt qua 8 thử thách chuột ngẫu nhiên (chỉ, nháy, nháy đúp, nháy phải, kéo thả, cuộn) để đoạt cúp vàng!',
    detailedTutorial: 'Em hãy chú ý đọc hoặc nghe kỹ hiệu lệnh của từng thử thách nhỏ và thực hiện thật chuẩn xác để nhận Cúp vô địch nhé!',
    hintTiers: {
      tier1: 'Đọc kỹ câu lệnh trên bảng và nhìn biểu tượng chuột hướng dẫn!',
      tier2: 'Thực hiện đúng thao tác chuột được yêu cầu nhé!',
      tier3: 'Nhìn gợi ý thao tác sáng lên trên màn hình và làm theo ngay!'
    },
    targetMouseButton: 'left'
  }
];
