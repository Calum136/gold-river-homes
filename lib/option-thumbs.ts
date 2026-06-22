import type { CSSProperties } from "react";

// Maps groupId:optionId → CSS properties for the material thumbnail in OptionTile.
// All backgrounds are self-contained (no external URLs) so the demo never has a broken image.
export function getOptionThumb(groupId: string, optId: string): CSSProperties {
  switch (`${groupId}:${optId}`) {

    // ── Siding Style ──────────────────────────────────────────
    case "sidingStyle:horizontal":
      return {
        background:
          "repeating-linear-gradient(0deg, #E0D5C0 0px,#E0D5C0 9px,#C8BCAA 9px,#C8BCAA 11px)",
      };
    case "sidingStyle:vertical":
      return {
        background:
          "repeating-linear-gradient(90deg, #E0D5C0 0px,#E0D5C0 18px,#C8BCAA 18px,#C8BCAA 20px)",
      };
    case "sidingStyle:board-batten":
      return {
        background:
          "repeating-linear-gradient(90deg, #E0D5C0 0px,#E0D5C0 24px,#B8A888 24px,#B8A888 26px,#E0D5C0 26px,#E0D5C0 30px,#C4B89E 30px,#C4B89E 33px)",
      };

    // ── Roof Type ──────────────────────────────────────────────
    case "roofType:shingles":
      return {
        background:
          "repeating-linear-gradient(180deg, #4A4540 0px,#4A4540 7px,#383330 7px,#383330 8px)",
      };
    case "roofType:metal":
      return {
        background:
          "repeating-linear-gradient(90deg, #606870 0px,#606870 16px,#404850 16px,#404850 18px)",
      };

    // ── Exterior Trim ──────────────────────────────────────────
    case "exteriorTrim:standard":
      return {
        background: "#F2EDE3",
        border: "2px solid #D8D2C8",
      };
    case "exteriorTrim:craftsman":
      return {
        background: "#F2EDE3",
        border: "3px solid #C8C2B8",
        boxShadow: "inset 0 5px 0 #E0DAD0",
      };
    case "exteriorTrim:colonial":
      return {
        background: "#F2EDE3",
        border: "2px solid #C8C2B8",
        boxShadow: "inset 0 0 0 4px #F2EDE3,inset 0 0 0 6px #C8C2B8",
      };

    // ── Flooring ───────────────────────────────────────────────
    case "flooring:lvp":
      return {
        background:
          "repeating-linear-gradient(90deg, #C8AA80 0px,#C8AA80 2px,#B89870 2px,#B89870 3px,#C8AA80 3px,#C8AA80 56px,#A88858 56px,#A88858 57px)",
        backgroundSize: "60px 36px",
      };
    case "flooring:laminate":
      return {
        background:
          "repeating-linear-gradient(90deg, #9A7A52 0px,#9A7A52 2px,#8A6A42 2px,#8A6A42 3px,#9A7A52 3px,#9A7A52 76px,#7A5A32 76px,#7A5A32 77px)",
        backgroundSize: "80px 48px",
      };
    case "flooring:hardwood":
      return {
        background:
          "repeating-linear-gradient(90deg, #5E3A20 0px,#5E3A20 2px,#4A2C18 2px,#4A2C18 3px,#5E3A20 3px,#5E3A20 88px,#3C2010 88px,#3C2010 89px)",
        backgroundSize: "92px 56px",
      };

    // ── Countertops ────────────────────────────────────────────
    case "countertops:laminate":
      return {
        background:
          "linear-gradient(135deg,#EAE2D8 25%,#DEDAD0 25%,#DEDAD0 50%,#E4DCD2 50%,#E4DCD2 75%,#DEDAD0 75%)",
        backgroundSize: "20px 20px",
      };
    case "countertops:quartz":
      return {
        background:
          "radial-gradient(ellipse at 30% 20%,#FDF9F6 0%,#EDE8E2 40%,#E4DDD8 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
      };

    // ── Cabinet Style ──────────────────────────────────────────
    case "cabinetStyle:standard":
      return {
        background: "#F0EDE8",
        border: "1.5px solid #D0CCC8",
      };
    case "cabinetStyle:shaker":
      return {
        background: "#F0EDE8",
        border: "2px solid #C8C4C0",
        boxShadow:
          "inset 4px 4px 0 #F0EDE8,inset 5px 5px 0 #D4D0CC,inset -4px -4px 0 #F0EDE8,inset -5px -5px 0 #D4D0CC",
      };
    case "cabinetStyle:premium-shaker":
      return {
        background: "linear-gradient(160deg,#EEE2C8 0%,#D8C8A0 60%,#C8B080 100%)",
        border: "2px solid #B89860",
        boxShadow:
          "inset 4px 4px 0 rgba(255,255,255,0.25),inset -4px -4px 0 rgba(0,0,0,0.1)",
      };

    // ── Paint Package ──────────────────────────────────────────
    case "paintPackage:builder-white":
      return { background: "#F5F2ED" };
    case "paintPackage:warm-neutral":
      return {
        background:
          "linear-gradient(135deg,#D9C9B0 0%,#C4B090 50%,#A89070 100%)",
      };
    case "paintPackage:premium-custom":
      return {
        background:
          "linear-gradient(135deg,#8B9E8C 0%,#C4A882 33%,#6B7D8E 66%,#A8956A 100%)",
      };

    // ── Interior Trim ──────────────────────────────────────────
    case "interiorTrim:standard":
      return {
        background: "#FFFFFF",
        border: "2.5px solid #E0E0DC",
      };
    case "interiorTrim:colonial":
      return {
        background: "#FFFFFF",
        border: "2px solid #D8D4D0",
        boxShadow: "inset 0 0 0 5px #FFFFFF,inset 0 0 0 7px #D8D4D0",
      };
    case "interiorTrim:craftsman":
      return {
        background: "#FFFFFF",
        border: "3px solid #CCCCCA",
        boxShadow: "inset 0 7px 0 #E4E4E0",
      };

    // ── Lighting Package ───────────────────────────────────────
    case "lightingPackage:standard":
      return {
        background:
          "radial-gradient(circle at 50% 20%,#FFF4D0 0%,#E8D898 50%,#C8B870 100%)",
      };
    case "lightingPackage:mid-range":
      return {
        background:
          "radial-gradient(circle at 50% 15%,#FFFAEC 0%,#F8E8B0 40%,#E0C870 100%),radial-gradient(circle at 25% 70%,rgba(255,240,160,0.6) 0%,transparent 60%)",
      };
    case "lightingPackage:premium":
      return {
        background:
          "radial-gradient(circle at 50% 10%,#FFFFFF 0%,#FFF8E8 30%,#FFE89C 70%,#E0C060 100%),radial-gradient(circle at 20% 60%,rgba(255,240,120,0.7) 0%,transparent 50%),radial-gradient(circle at 80% 60%,rgba(255,240,120,0.7) 0%,transparent 50%)",
      };

    // ── Hardware Finish ────────────────────────────────────────
    case "hardwareFinish:brushed-nickel":
      return {
        background:
          "linear-gradient(135deg,#DEDEDA 0%,#C4C4C0 40%,#B0B0AC 100%)",
      };
    case "hardwareFinish:matte-black":
      return {
        background:
          "linear-gradient(135deg,#3C3C3C 0%,#2A2A2A 50%,#1E1E1E 100%)",
      };
    case "hardwareFinish:aged-bronze":
      return {
        background:
          "linear-gradient(135deg,#8A6A38 0%,#6B4A28 50%,#5A3A18 100%)",
      };

    // ── Insulation ─────────────────────────────────────────────
    case "insulation:standard":
      return {
        background:
          "repeating-linear-gradient(45deg,#FFD080 0px,#FFD080 4px,#F0C060 4px,#F0C060 8px)",
      };
    case "insulation:enhanced":
      return {
        background:
          "repeating-linear-gradient(45deg,#FF9840 0px,#FF9840 4px,#E07820 4px,#E07820 8px)",
      };
    case "insulation:premium":
      return {
        background:
          "repeating-linear-gradient(45deg,#FF5828 0px,#FF5828 4px,#E03818 4px,#E03818 8px)",
      };

    default:
      return { background: "#2A2D30" };
  }
}
