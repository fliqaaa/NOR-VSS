/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WellnessType = 'pool' | 'sauna' | 'massage';

export interface Benefit {
  id: string;
  text: string;
}

export interface WellnessDetails {
  type: WellnessType;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  benefits: string[];
  metrics: {
    label: string;
    value: string;
  }[];
}

export interface ARState {
  step: 'intro' | 'scanning' | 'ready_to_place' | 'placed';
  selectedObject: WellnessType | null;
  cameraActive: boolean;
  cameraPermissionGranted: boolean;
  surfaceDetected: boolean;
}
