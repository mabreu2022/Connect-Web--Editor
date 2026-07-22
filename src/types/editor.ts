export type EditorMode = 'design' | 'code' | 'split';
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type ComponentCategory = 'layout' | 'forms' | 'typography' | 'ui' | 'sections' | 'templates';

export type ComponentType = 
  // Layout
  | 'container'
  | 'section'
  | 'grid-2'
  | 'grid-3'
  | 'card'
  | 'divider'
  // Forms
  | 'form'
  | 'input-text'
  | 'input-email'
  | 'input-password'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'button'
  | 'form-group'
  // Typography & UI
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'link'
  | 'badge'
  | 'nav'
  | 'hero'
  // Composite Sections
  | 'section-pricing'
  | 'section-testimonials'
  | 'section-faq'
  | 'section-features'
  | 'footer'
  | 'section-cta'
  | 'section-features-list'
  // Templates & WebRTC Chat
  | 'template-login'
  | 'template-contact'
  | 'template-signup'
  | 'widget-chat';

export interface ElementNode {
  id: string;
  type: ComponentType;
  tagName: string;
  label: string;
  content?: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  children: ElementNode[];
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  author: string;
  ogImage: string;
}

export interface PageItem {
  id: string;
  fileName: string; // e.g. index.html, sobre.html, contato.html
  title: string;
  nodes: ElementNode[];
  seo: SEOSettings;
}

export interface ComponentPaletteItem {
  type: ComponentType;
  label: string;
  category: ComponentCategory;
  iconName: string;
  defaultNode: () => ElementNode;
}

export interface HistoryState {
  nodes: ElementNode[];
  selectedId: string | null;
}

export interface BotFAQItem {
  id: string;
  keywords: string[];
  reply: string;
}

export interface BotConfig {
  qapPhone: string;
  startTime: string; // ex: "08:00"
  endTime: string;   // ex: "18:00"
  outOfHoursMessage: string;
  faqList: BotFAQItem[];
}
