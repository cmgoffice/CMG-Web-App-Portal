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
}

export interface AppData {
  [key: string]: TabData;
}
