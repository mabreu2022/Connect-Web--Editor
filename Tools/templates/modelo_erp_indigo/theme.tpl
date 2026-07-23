unit uTheme;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} — Tema Visual ERP Corporate Indigo (Modern SaaS) }
{ Paleta: Deep Indigo + Electric Violet + Soft Lavender Content }

interface

uses
  Graphics;

// ============================================================
// Paleta de cores — ERP Corporate Indigo
// Convenção: cores em formato BGR do Windows (COLORREF)
// ============================================================

const
  // === SIDEBAR ===
  CLR_SIDEBAR_BG        = $4B1B1E;   // #1E1B4B Deep Indigo
  CLR_SIDEBAR_BG_REAL   = $4B1B1E;
  CLR_SIDEBAR_ITEM      = $812E31;   // #312E81 item normal bg
  CLR_SIDEBAR_ITEM_HOV  = $9D373C;   // #3C379D item hover
  CLR_SIDEBAR_ITEM_ACT  = $F16663;   // #6366F1 Electric Indigo Accent
  CLR_SIDEBAR_TEXT      = $FFFFFF;   // texto branco
  CLR_SIDEBAR_TEXT_SUB  = $FCB4A5;   // #A5B4FC texto secundário
  CLR_SIDEBAR_BORDER    = $812E31;   // borda separadora
  CLR_SIDEBAR_LOGO_BG   = $951D4C;   // #4C1D95 Logo Accent

  CLR_SIDE_BG     = 4922142;   // #1E1B4B deep indigo
  CLR_SIDE_HOVER  = 8465969;   // #312E81 hover
  CLR_SIDE_ACTIVE = 15820387;  // #6366F1 electric indigo accent
  CLR_SIDE_TEXT   = 16777215;  // #FFFFFF white
  CLR_SIDE_SUBTEXT= 16561317;  // #A5B4FC soft indigo-grey
  CLR_SIDE_LOGO   = 9772364;   // #4C1D95 amethyst logo bg

  // === CONTENT AREA ===
  CLR_CONTENT_BG  = 16774133;  // #F5F3FF soft lavender white
  CLR_CARD_BG     = 16777215;  // #FFFFFF white cards
  CLR_CARD_BORDER = 16771040;  // #E0E7FF light border

  // === HEADER ===
  CLR_HEADER_BG   = 16777215;  // #FFFFFF white header
  CLR_HEADER_TEXT = 4922142;   // #1E1B4B dark indigo text

  // === TEXTO ===
  CLR_TEXT_PRIMARY   = 4922142;  // #1E1B4B dark indigo
  CLR_TEXT_SECONDARY = 13252675; // #4338CA indigo text
  CLR_TEXT_MUTED     = 16700103; // #C7D2FE muted border/text

  // === STATUS / SEMÁFORO ===
  CLR_STATUS_OK   = 6920197;   // #059669 emerald success
  CLR_STATUS_WARN = 423897;    // #D97706 amber warning
  CLR_STATUS_ERR  = 2500316;   // #DC2626 red danger
  CLR_STATUS_INFO = 15025743;  // #4F46E5 indigo info

  // === BOTÕES PRIMÁRIOS ===
  CLR_BTN_PRIMARY    = 15820387; // #6366F1 electric indigo
  CLR_BTN_SUCCESS    = 6920197;  // #059669 emerald
  CLR_BTN_DANGER     = 2500316;  // #DC2626 red
  CLR_BTN_SECONDARY  = 13252675; // #4338CA indigo

  // === GRID ===
  CLR_GRID_HEADER    = 8465969;  // #312E81 dark header
  CLR_GRID_SELECTED  = 15820387; // #6366F1 electric indigo selected row
  CLR_GRID_ALT_ROW   = 16773870; // #EEF2FF alternating row

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
