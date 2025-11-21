export interface NameOfAllah {
    id: number;
    mosqueId: number;
    arabic: string;
    transcription: string;
    meaning: string;
    transcriptionTatar?: string;
    meaningTatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNameOfAllahDto {
    arabic: string;
    transcription: string;
    meaning: string;
    transcriptionTatar?: string;
    meaningTatar?: string;
}

export interface UpdateNameOfAllahDto {
    transcription?: string;
    meaning?: string;
    transcriptionTatar?: string;
    meaningTatar?: string;
}

