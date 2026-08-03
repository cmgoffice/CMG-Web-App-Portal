export interface App {
  name: string;
  url: string;
  icon: string;
  color: string;
  desc: string;
  emoji?: string;
  active?: boolean;
}

export interface TabData {
  title: string;
  apps: App[];
  icon?: string;
  color?: string;
  isCustom?: boolean;
}

export interface AppData {
  _menuOrder?: string[];
  [key: string]: TabData | string[] | undefined;
}
