unit uTheme;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} — Tema Visual ERP Cyber Dark (Modern Tech Dark Mode) }
{ Paleta: Pure Dark Charcoal + Neon Cyan + High Contrast Cards }

interface

uses
  Graphics;

// ============================================================
// Paleta de cores — ERP Cyber Dark Mode
// Convenção: cores em formato BGR do Windows (COLORREF)
// ============================================================

const
  // === SIDEBAR ===
  CLR_SIDEBAR_BG        = $121212;   // #121212 Pure Dark Charcoal
  CLR_SIDEBAR_BG_REAL   = $121212;
  CLR_SIDEBAR_ITEM      = $2A2727;   // #27272A Zinc Dark Item
  CLR_SIDEBAR_ITEM_HOV  = $3A3535;   // #35353A Hover
  CLR_SIDEBAR_ITEM_ACT  = $D4B606;   // #06B6D4 Neon Cyan Accent
  CLR_SIDEBAR_TEXT      = $F5F4F4;   // #F4F4F5 High Contrast Text
  CLR_SIDEBAR_TEXT_SUB  = $7A7171;   // #71717A Muted Subtext
  CLR_SIDEBAR_BORDER    = $463F3F;   // #3F3F46 Border
  CLR_SIDEBAR_LOGO_BG   = $C78402;   // #0284C7 Sky Accent Logo

  CLR_SIDE_BG     = 1184274;   // #121212 pure dark
  CLR_SIDE_HOVER  = 2762535;   // #27272A zinc hover
  CLR_SIDE_ACTIVE = 13940230;  // #06B6D4 neon cyan accent
  CLR_SIDE_TEXT   = 16119028;  // #F4F4F5 high contrast white
  CLR_SIDE_SUBTEXT= 8024433;   // #71717A zinc subtext
  CLR_SIDE_LOGO   = 13075458;  // #0284C7 sky blue logo bg

  // === CONTENT AREA ===
  CLR_CONTENT_BG  = 1775640;   // #18181B dark background
  CLR_CARD_BG     = 2762535;   // #27272A dark zinc cards
  CLR_CARD_BORDER = 4603711;   // #3F3F46 card border

  // === HEADER ===
  CLR_HEADER_BG   = 2762535;   // #27272A header
  CLR_HEADER_TEXT = 16119028;  // #F4F4F5 text

  // === TEXTO ===
  CLR_TEXT_PRIMARY   = 16119028; // #F4F4F5 white text
  CLR_TEXT_SECONDARY = 11182497; // #A1A1AA zinc text
  CLR_TEXT_MUTED     = 5984850;  // #52525B dark muted

  // === STATUS / SEMÁFORO ===
  CLR_STATUS_OK   = 8501520;   // #10B981 emerald success
  CLR_STATUS_WARN = 761589;    // #F59E0B amber warning
  CLR_STATUS_ERR  = 4474095;   // #EF4444 red danger
  CLR_STATUS_INFO = 13940230;  // #06B6D4 cyan info

  // === BOTÕES PRIMÁRIOS ===
  CLR_BTN_PRIMARY    = 13940230; // #06B6D4 neon cyan
  CLR_BTN_SUCCESS    = 8501520;  // #10B981 emerald
  CLR_BTN_DANGER     = 4474095;  // #EF4444 red
  CLR_BTN_SECONDARY  = 5984850;  // #52525B zinc

  // === GRID ===
  CLR_GRID_HEADER    = 1775640;  // #18181B dark header
  CLR_GRID_SELECTED  = 13940230; // #06B6D4 cyan selected row
  CLR_GRID_ALT_ROW   = 2301984;  // #202023 alternating row

  // === DIMENSÕES ===
  DIM_SIDEBAR_EXPANDED  = 220;   // px — largura expandida
  DIM_SIDEBAR_COLLAPSED = 64;    // px — largura colapsada
  DIM_HEADER_HEIGHT     = 56;    // px
  DIM_CARD_RADIUS       = 8;     // px
  DIM_ANIM_STEP         = 16;    // px por tick de animação
  DIM_ANIM_INTERVAL     = 12;    // ms por tick

  // === FONTES ===
  FONT_DEFAULT  = 'Segoe UI';
  FONT_TITLE    = 'Segoe UI';
  FONT_MONO     = 'Consolas';
  FONT_SIZE_SM  = 11;
  FONT_SIZE_MD  = 13;
  FONT_SIZE_LG  = 16;
  FONT_SIZE_XL  = 22;

  // === ÍCONES (caracteres Unicode) ===
  ICO_DASHBOARD  = '🏠';
  ICO_CLIENTES   = '👥';
  ICO_PRODUTOS   = '📦';
  ICO_PEDIDOS    = '📋';
  ICO_PDV        = '🛒';
  ICO_RELATORIOS = '📊';
  ICO_CONFIG     = '⚙️';
  ICO_SAIR       = '🚪';
  ICO_NOVO       = '➕';
  ICO_EDITAR     = '✏️';
  ICO_EXCLUIR    = '🗑️';
  ICO_BUSCAR     = '🔍';
  ICO_IMPRIMIR   = '🖨️';
  ICO_ATUALIZAR  = '🔄';
  ICO_VOLTAR     = '◀';
  ICO_HAMBURGER  = '☰';
  ICO_CHECK      = '✓';
  ICO_CLOSE      = '✗';

implementation

end.
