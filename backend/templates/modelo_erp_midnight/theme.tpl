unit uTheme;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} — Tema Visual ERP Midnight Navy (Dark Executive) }
{ Paleta: Slate Navy + Emerald Teal + Ice White Content }

interface

uses
  Graphics;

// ============================================================
// Paleta de cores — ERP Midnight Navy Executive
// Convenção: cores em formato BGR do Windows (COLORREF)
// ============================================================

const
  // === SIDEBAR ===
  CLR_SIDEBAR_BG        = $2A170F;   // #0F172A Slate Navy
  CLR_SIDEBAR_BG_REAL   = $2A170F;
  CLR_SIDEBAR_ITEM      = $3B291E;   // #1E293B item normal bg
  CLR_SIDEBAR_ITEM_HOV  = $473324;   // #243347 item hover
  CLR_SIDEBAR_ITEM_ACT  = $88940D;   // #0D9488 Teal Accent
  CLR_SIDEBAR_TEXT      = $FFFFFF;   // texto branco
  CLR_SIDEBAR_TEXT_SUB  = $B8A394;   // #94A3B8 texto secundário
  CLR_SIDEBAR_BORDER    = $3B291E;   // borda separadora
  CLR_SIDEBAR_LOGO_BG   = $C78402;   // #0284C7 Logo Accent

  CLR_SIDE_BG     = 2758415;   // #0F172A dark slate navy
  CLR_SIDE_HOVER  = 3877150;   // #1E293B hover
  CLR_SIDE_ACTIVE = 8950797;   // #0D9488 emerald teal accent
  CLR_SIDE_TEXT   = 16777215;  // #FFFFFF white
  CLR_SIDE_SUBTEXT= 12058644;  // #94A3B8 grey-blue
  CLR_SIDE_LOGO   = 13075458;  // #0284C7 sky blue logo bg

  // === CONTENT AREA ===
  CLR_CONTENT_BG  = 16579320;  // #F8FAFC ice white
  CLR_CARD_BG     = 16777215;  // #FFFFFF white cards
  CLR_CARD_BORDER = 15788258;  // #E2E8F0 light border

  // === HEADER ===
  CLR_HEADER_BG   = 16777215;  // #FFFFFF white header
  CLR_HEADER_TEXT = 2758415;   // #0F172A dark text

  // === TEXTO ===
  CLR_TEXT_PRIMARY   = 2758415;  // #0F172A dark navy text
  CLR_TEXT_SECONDARY = 9139300;  // #64748B slate text
  CLR_TEXT_MUTED     = 14799819; // #CBD5E1 muted border/text

  // === STATUS / SEMÁFORO ===
  CLR_STATUS_OK   = 8501520;   // #10B981 emerald success
  CLR_STATUS_WARN = 761589;    // #F59E0B amber warning
  CLR_STATUS_ERR  = 4474095;   // #EF4444 red danger
  CLR_STATUS_INFO = 15312142;  // #0EA5E9 sky info

  // === BOTÕES PRIMÁRIOS ===
  CLR_BTN_PRIMARY    = 8950797;  // #0D9488 teal
  CLR_BTN_SUCCESS    = 8501520;  // #10B981 emerald
  CLR_BTN_DANGER     = 4474095;  // #EF4444 red
  CLR_BTN_SECONDARY  = 9139300;  // #64748B slate

  // === GRID ===
  CLR_GRID_HEADER    = 3877150;  // #1E293B dark header
  CLR_GRID_SELECTED  = 8950797;  // #0D9488 teal selected row
  CLR_GRID_ALT_ROW   = 16381425; // #F1F5F9 alternating row

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
