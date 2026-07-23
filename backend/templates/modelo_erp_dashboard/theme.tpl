unit uTheme;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} — Tema Visual ERP Dashboard }
{ Paleta: Dark Navy + Blue Accent + Light Content }

interface

uses
  Graphics;

// ============================================================
// Paleta de cores — ERP Dark Professional
// Convenção: cores em formato BGR do Windows (COLORREF)
// ============================================================

const
  // === SIDEBAR ===
  CLR_SIDEBAR_BG        = $3C1E1E;   // dark navy  #1E1E3C (deep dark)
  CLR_SIDEBAR_BG_REAL   = $231808;   // #080818  very dark blue-purple
  CLR_SIDEBAR_ITEM      = $4A3020;   // item normal bg
  CLR_SIDEBAR_ITEM_HOV  = $663C28;   // item hover
  CLR_SIDEBAR_ITEM_ACT  = $AB8000;   // item ativo — accent #0080AB (azul)
  CLR_SIDEBAR_TEXT      = $FFFFFF;   // texto branco
  CLR_SIDEBAR_TEXT_SUB  = $AAAAAA;   // texto secundário
  CLR_SIDEBAR_BORDER    = $553333;   // borda separadora
  CLR_SIDEBAR_LOGO_BG   = $8B0000;   // logo bg (accent mais escuro)

  // Valores corretos (BGR Little-Endian):
  // Dark navy #1A1D2E → R=26,G=29,B=46 → BGR = 46*65536+29*256+26 = 3023898
  // Blue accent #0D6EFD → R=13,G=110,B=253 → BGR = 253*65536+110*256+13 = 16609293
  // Hover #252836 → R=37,G=40,B=54 → BGR = 54*65536+40*256+37 = 3547173
  // Active #0D6EFD → same as blue accent

  CLR_SIDE_BG     = 3023898;   // #1A1D2E dark navy
  CLR_SIDE_HOVER  = 3547173;   // #252836 hover
  CLR_SIDE_ACTIVE = 16609293;  // #0D6EFD blue accent
  CLR_SIDE_TEXT   = 16777215;  // #FFFFFF white
  CLR_SIDE_SUBTEXT= 11184810;  // #AAAAAA grey
  CLR_SIDE_LOGO   = 2697513;   // #292170 logo bg

  // === CONTENT AREA ===
  // #F0F2F5 light grey background → R=240,G=242,B=245 → 245*65536+242*256+240 = 16053488
  CLR_CONTENT_BG  = 16053488;  // #F0F2F5
  CLR_CARD_BG     = 16777215;  // #FFFFFF white cards
  CLR_CARD_BORDER = 14671839;  // #E0E6FF light border

  // === HEADER ===
  // #FFFFFF white header
  CLR_HEADER_BG   = 16777215;
  CLR_HEADER_TEXT = 2171169;   // #212121 dark text

  // === TEXTO ===
  CLR_TEXT_PRIMARY   = 2236196;  // #222444 dark
  CLR_TEXT_SECONDARY = 7829367;  // #777777 grey
  CLR_TEXT_MUTED     = 11382189; // #ADASAD

  // === STATUS / SEMÁFORO ===
  CLR_SUCCESS = 3394611;   // #33CC33 → não, vamos usar: #28A745 R=40,G=167,B=69 → 69*65536+167*256+40 = 4569896
  CLR_WARNING = 178;       // #FF6D00 → R=255,G=109,B=0 → 0*65536+109*256+255 = 28159
  CLR_DANGER  = 4278190;   // #FF0000 vermelho → R=255,G=0,B=0 → 255
  CLR_INFO    = 14143232;  // #0288D1 azul info
  CLR_MUTED   = 8947848;   // #888888

  // Valores corrigidos:
  CLR_STATUS_OK   = 4569896;  // #28A745 verde sucesso
  CLR_STATUS_WARN = 28159;    // #FF6D00 laranja aviso
  CLR_STATUS_ERR  = 255;      // #FF0000 vermelho erro
  CLR_STATUS_INFO = 13716234; // #0288D1 azul info → R=2,G=136,B=209 → 209*65536+136*256+2 = 13731842

  // === BOTÕES PRIMÁRIOS ===
  CLR_BTN_PRIMARY    = 16609293; // #0D6EFD blue
  CLR_BTN_SUCCESS    = 4569896;  // #28A745 green
  CLR_BTN_DANGER     = 2237474;  // #CC2222 red-ish
  CLR_BTN_SECONDARY  = 8421504;  // #808080 grey

  // === GRID ===
  CLR_GRID_HEADER    = 3547173;  // dark header (matches sidebar hover)
  CLR_GRID_SELECTED  = 16609293; // blue selected row
  CLR_GRID_ALT_ROW   = 15921906; // #F2F2F2 alternating row

  // === DIMENSÕES ===
  DIM_SIDEBAR_EXPANDED  = 220;   // px — largura expandida
  DIM_SIDEBAR_COLLAPSED = 64;    // px — largura colapsada
  DIM_HEADER_HEIGHT     = 56;    // px
  DIM_CARD_RADIUS       = 8;     // px — arredondamento de cards (via custom paint)
  DIM_ANIM_STEP         = 16;    // px por tick de animação
  DIM_ANIM_INTERVAL     = 12;    // ms por tick (~83fps)

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
