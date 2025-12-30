export interface AvatarDemographics {
  age: number;
  gender: string;
  location: string;
  income: string;
}

export interface AvatarPsychographics {
  struggles: string[];
  goals: string[];
  fears: string[];
  frustrations: string[];
}

export interface AvatarPersonaData {
  demographics: AvatarDemographics;
  psychographics: AvatarPsychographics;
  buying_behavior: string;
  communication_style: string;
  prompt_persona: string;
}

export interface Avatar {
  name: string;
  demographics: AvatarDemographics;
  psychographics: AvatarPsychographics;
  buying_behavior: string;
  communication_style: string;
  prompt_persona: string;
}

export interface AvatarSet {
  setName: string;
  niche: string;
  description?: string;
  avatars: Avatar[];
  createdAt?: string;
}

export interface GenerateAvatarsRequest {
  niche: string;
  setName?: string;
  description?: string;
}

export interface GenerateAvatarsResponse {
  success: boolean;
  setName: string;
  avatars: Avatar[];
  message: string;
}
