export enum SceneDesignType {
  Form = "FORM",
  Report = "REPORT",
  Application = "APPLICATION",
}

export interface Scene {
  id?: string;
  name?: string;
  code?: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
  defaulted?: boolean;
  sort?: number;
  typeName?: string;
  designType: SceneDesignType;
}

export interface ComponentGroup {
  id?: string;
  name?: string;
  icon?: string;
  disabled?: boolean;
  sort?: number;
  designType?: SceneDesignType;
}
