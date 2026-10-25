/**
 * Scenery & Architecture Renderer for TRƯỜNG THPT TAM PHƯỚC
 * Faithful Vietnamese high school aesthetic:
 * - Yellow colonial style school building with red tile roof
 * - Tall flagpole with Vietnamese national flag waving in the breeze
 * - Bold red banner: "TRƯỜNG THPT TAM PHƯỚC" & "TIÊN HỌC LỄ - HẬU HỌC VĂN"
 * - Shady flamboyant / poinciana flower trees ("Cây phượng vĩ nở hoa đỏ rực")
 * - Tiled courtyard, concrete benches, bicycle racks
 * - Gateway portal returning to Sông Buông
 */

export class TamPhuocSchoolScenery {
  public static drawEnvironment(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timer: number
  ) {
    // 1. Sky & Sun Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 380);
    skyGrad.addColorStop(0, '#38BDF8'); // Bright tropical sky
    skyGrad.addColorStop(0.6, '#BAE6FD');
    skyGrad.addColorStop(1, '#FEF08A'); // Warm sunny afternoon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Warm sun
    ctx.save();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.beginPath();
    ctx.arc(width - 200, 90, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(width - 200, 90, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fluffy clouds
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    [
      { x: (120 + timer * 8) % width, y: 70, s: 0.9 },
      { x: (500 + timer * 6) % width, y: 110, s: 1.1 },
      { x: (880 + timer * 10) % width, y: 60, s: 0.8 },
    ].forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 24 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 20 * c.s, c.y - 10 * c.s, 28 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 44 * c.s, c.y, 22 * c.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 2. Main High School Building (TRƯỜNG THPT TAM PHƯỚC)
    // Building body
    const bldgX = 260;
    const bldgY = 170;
    const bldgW = 720;
    const bldgH = 300;

    // Building drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(bldgX - 10, bldgY + 20, bldgW + 20, bldgH);

    // Primary wall (Classic Vietnamese yellow school wall)
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(bldgX, bldgY, bldgW, bldgH);

    // Wall trims & pillars
    ctx.fillStyle = '#EAB308';
    for (let p = 0; p <= 6; p++) {
      const px = bldgX + (p * bldgW) / 6;
      ctx.fillRect(px - 6, bldgY, 12, bldgH);
    }

    // Classroom windows (green shutters)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const wx = bldgX + 25 + col * 115;
        const wy = bldgY + 45 + row * 85;

        // Window frame
        ctx.fillStyle = '#166534'; // Forest green shutters
        ctx.fillRect(wx, wy, 65, 55);

        // Glass panes
        ctx.fillStyle = '#67E8F9';
        ctx.fillRect(wx + 6, wy + 6, 24, 43);
        ctx.fillRect(wx + 35, wy + 6, 24, 43);

        // Window mullion
        ctx.fillStyle = '#14532D';
        ctx.fillRect(wx + 30, wy, 5, 55);
        ctx.fillRect(wx, wy + 26, 65, 4);
      }
    }

    // Red tile roof (Mái ngói đỏ truyền thống)
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(bldgX - 40, bldgY);
    ctx.lineTo(bldgX + bldgW / 2, bldgY - 70);
    ctx.lineTo(bldgX + bldgW + 40, bldgY);
    ctx.closePath();
    ctx.fill();

    // Roof ridge trim
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Central Pediment & High School Signboard
    const signX = bldgX + bldgW / 2 - 180;
    const signY = bldgY - 45;

    ctx.fillStyle = '#991B1B';
    ctx.fillRect(signX, signY, 360, 42);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(signX, signY, 360, 42);

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 16px Rowdies, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRƯỜNG THPT TAM PHƯỚC', bldgX + bldgW / 2, signY + 26);

    // School Slogan Banner: "TIÊN HỌC LỄ - HẬU HỌC VĂN"
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(bldgX + bldgW / 2 - 140, bldgY + 8, 280, 24);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('TIÊN HỌC LỄ - HẬU HỌC VĂN', bldgX + bldgW / 2, bldgY + 24);

    // 4. Vietnamese National Flag on Tall Flagpole (Cột cờ tổ quốc)
    const poleX = 180;
    const poleTopY = 80;
    const poleBaseY = 470;

    // Pole
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(poleX - 3, poleTopY, 6, poleBaseY - poleTopY);
    ctx.fillStyle = '#FACC15'; // Golden finial sphere
    ctx.beginPath();
    ctx.arc(poleX, poleTopY - 4, 7, 0, Math.PI * 2);
    ctx.fill();

    // Vietnamese Red Flag waving
    const flagW = 54;
    const flagH = 36;
    const wave = Math.sin(timer * 6) * 4;

    ctx.save();
    ctx.translate(poleX + 3, poleTopY + 10);
    ctx.fillStyle = '#DA251D'; // Official Vietnam red
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(flagW * 0.5, wave, flagW, 0);
    ctx.lineTo(flagW, flagH);
    ctx.quadraticCurveTo(flagW * 0.5, flagH + wave, 0, flagH);
    ctx.closePath();
    ctx.fill();

    // Golden Five-Pointed Star
    ctx.fillStyle = '#FFFF00';
    const starCenterX = flagW * 0.5;
    const starCenterY = flagH * 0.5 + wave * 0.5;
    drawStar(ctx, starCenterX, starCenterY, 5, 9, 4);
    ctx.restore();

    // 5. Flamboyant / Poinciana Trees ("Cây phượng vĩ đỏ")
    drawPoincianaTree(ctx, 80, 470, timer);
    drawPoincianaTree(ctx, 1050, 470, timer + 1.2);

    // 6. Red Poinciana Petals falling gently across the schoolyard
    ctx.save();
    for (let p = 0; p < 12; p++) {
      const px = (p * 95 + timer * 25) % width;
      const py = 120 + ((p * 45 + timer * 35) % 360);
      const pr = Math.sin(timer * 4 + p) * 0.6;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pr);
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 7. Stone benches & bicycle parking rack
    drawSchoolyardDetails(ctx);
  }

  /**
   * Draws the gateway portal back to Sông Buông on the left
   */
  public static drawExitDoor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    animTimer: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    const pulse = Math.sin(animTimer * 5) * 2;

    // School Gate pillars
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(0, 0, 14, h);
    ctx.fillRect(w - 14, 0, 14, h);

    // Archway
    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.arc(w / 2, 28, w / 2, Math.PI, 0);
    ctx.fill();

    // Portal glowing opening
    const pGrad = ctx.createLinearGradient(0, 20, 0, h);
    pGrad.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
    pGrad.addColorStop(1, 'rgba(14, 165, 233, 0.3)');
    ctx.fillStyle = pGrad;
    ctx.fillRect(14, 20, w - 28, h - 20);

    // Arch banner: "CỔNG RA SÔNG BUÔNG"
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-10, -18, w + 20, 20);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -18, w + 20, 20);

    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚪 RA SÔNG BUÔNG', w / 2, -5);

    // Floating prompt
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-8, -42 + pulse, w + 16, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillText('Nhấn phím E', w / 2, -30 + pulse);

    ctx.restore();
  }

  /**
   * Draws the entrance gate inside Sông Buông leading into THPT Tam Phước
   */
  public static drawEntranceDoorInLevel1(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    animTimer: number,
    isNearby: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    const pulse = Math.sin(animTimer * 5) * 2;

    // Brick Gate pillars
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(0, 0, 14, h);
    ctx.fillRect(w - 14, 0, 14, h);

    // Arch top
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.arc(w / 2, 26, w / 2, Math.PI, 0);
    ctx.fill();

    // Portal portal vortex
    const pGrad = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, 45);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    pGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.7)');
    pGrad.addColorStop(1, 'rgba(185, 28, 28, 0.4)');
    ctx.fillStyle = pGrad;
    ctx.fillRect(14, 20, w - 28, h - 20);

    // Signboard: "TRƯỜNG THPT TAM PHƯỚC"
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(-20, -22, w + 40, 22);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-20, -22, w + 40, 22);

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 9px Rowdies, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRƯỜNG THPT TAM PHƯỚC', w / 2, -8);

    // Callout Prompt
    ctx.fillStyle = isNearby ? '#EF4444' : 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-16, -46 + pulse, w + 32, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillText('🚪 Vào Trường Đòi Dép (Nhấn E)', w / 2, -34 + pulse);

    ctx.restore();
  }
}

function drawPoincianaTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  timer: number
) {
  ctx.save();
  ctx.translate(x, groundY);

  // Trunk
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(-8, -80, -20, -180);
  ctx.lineTo(20, -180);
  ctx.quadraticCurveTo(8, -80, 16, 0);
  ctx.closePath();
  ctx.fill();

  // Green foliage & vibrant red poinciana blossoms
  const sway = Math.sin(timer * 2) * 4;
  [
    { dx: -35 + sway, dy: -210, r: 42, c: '#15803D' },
    { dx: 35 + sway, dy: -215, r: 46, c: '#16A34A' },
    { dx: 0 + sway, dy: -240, r: 52, c: '#15803D' },
    // Red blossoms
    { dx: -25 + sway, dy: -230, r: 24, c: '#DC2626' },
    { dx: 25 + sway, dy: -225, r: 26, c: '#EF4444' },
    { dx: 0 + sway, dy: -250, r: 30, c: '#DC2626' },
    { dx: -45 + sway, dy: -195, r: 18, c: '#F87171' },
    { dx: 45 + sway, dy: -200, r: 20, c: '#F87171' },
  ].forEach((f) => {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.arc(f.dx, f.dy, f.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawSchoolyardDetails(ctx: CanvasRenderingContext2D) {
  // Concrete benches
  [210, 840].forEach((bx) => {
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(bx, 440, 55, 6);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(bx + 8, 446, 8, 24);
    ctx.fillRect(bx + 39, 446, 8, 24);
  });

  // Kệ Dép Học Sinh THPT Tam Phước (Where Trường sneaks around to steal slippers!)
  ctx.save();
  const rackX = 700;
  const rackY = 415;
  const rackW = 86;
  const rackH = 55;

  // Wooden frame
  ctx.fillStyle = '#78350F';
  ctx.fillRect(rackX, rackY, 6, rackH);
  ctx.fillRect(rackX + rackW - 6, rackY, 6, rackH);
  // Shelves
  ctx.fillStyle = '#B45309';
  ctx.fillRect(rackX, rackY + 16, rackW, 4);
  ctx.fillRect(rackX, rackY + 34, rackW, 4);
  ctx.fillRect(rackX, rackY + 51, rackW, 4);

  // Slippers sitting on shelves
  // Top tier slippers
  ctx.fillStyle = '#FACC15'; // Dép tổ ong vàng
  ctx.beginPath();
  ctx.ellipse(rackX + 16, rackY + 13, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(rackX + 28, rackY + 13, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38BDF8'; // Dép xanh
  ctx.beginPath();
  ctx.ellipse(rackX + 48, rackY + 13, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(rackX + 60, rackY + 13, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Middle tier slippers
  ctx.fillStyle = '#FB7185'; // Dép hồng
  ctx.beginPath();
  ctx.ellipse(rackX + 18, rackY + 31, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(rackX + 30, rackY + 31, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FACC15'; // Another Dép tổ ong
  ctx.beginPath();
  ctx.ellipse(rackX + 52, rackY + 31, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(rackX + 64, rackY + 31, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Warning sign above shoe rack
  ctx.fillStyle = '#FEF08A';
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 1;
  ctx.fillRect(rackX - 10, rackY - 14, rackW + 20, 14);
  ctx.strokeRect(rackX - 10, rackY - 14, rackW + 20, 14);
  ctx.fillStyle = '#991B1B';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👟 KỆ DÉP - COI CHỪNG MẤT', rackX + rackW / 2, rackY - 4);

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}
