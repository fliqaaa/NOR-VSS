/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WellnessDetails } from './types';

export const wellnessData: Record<string, WellnessDetails> = {
  pool: {
    type: 'pool',
    title: 'Thermal Pool',
    subtitle: 'Healing Springs of Topolšica',
    description: 'Relax in warm thermal water surrounded by a peaceful wellness environment. The thermal spring waters are rich in beneficial minerals that soothe the body, relieve fatigue, and revitalize energy.',
    imageUrl: '/src/assets/images/terme_thermal_pool_1782655292707.jpg',
    benefits: [
      'deep muscle relaxation',
      'stress and anxiety relief',
      'improved cardiovascular circulation',
      'soothing joint pain & tension'
    ],
    metrics: [
      { label: 'Temp', value: '32°C - 34°C' },
      { label: 'Stay', value: '20–30 mins' },
      { label: 'Depth', value: '1.35 m' }
    ]
  },
  sauna: {
    type: 'sauna',
    title: 'Traditional Dry Sauna',
    subtitle: 'Finnish Detoxification Cabin',
    description: 'Experience intense dry heat that helps detoxify the body and relax muscles. Perfect for cleansing pores and boosting immune systems in an authentic warm wooden setting.',
    imageUrl: '/src/assets/images/terme_dry_sauna_1782655310982.jpg',
    benefits: [
      'deep cellular detoxification',
      'intense muscle relaxation',
      'enhanced immune system support',
      'deep skin purification'
    ],
    metrics: [
      { label: 'Temp', value: '90°C' },
      { label: 'Stay', value: '10–15 mins' },
      { label: 'Humidity', value: '10% - 15%' }
    ]
  },
  massage: {
    type: 'massage',
    title: 'Relax Massage',
    subtitle: 'Aromatic Holistic Renewal',
    description: 'Professional massage treatments for complete body and mind relaxation. Tailored with natural oils and basalt hot stones to release blockages, soothe nerves, and restore energetic flow.',
    imageUrl: '/src/assets/images/terme_relax_massage_1782655324149.jpg',
    benefits: [
      'reduced physical muscle tension',
      'improved overall mental wellbeing',
      'immediate stress & cortisol reduction',
      'lymphatic drainage booster'
    ],
    metrics: [
      { label: 'Duration', value: '30–60 mins' },
      { label: 'Style', value: 'Swedish & Stone' },
      { label: 'Aroma', value: 'Lavender & Pine' }
    ]
  }
};
