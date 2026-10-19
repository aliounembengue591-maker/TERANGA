// Liste exhaustive de TOUS les quartiers, communes et arrondissements de la région de Dakar sans exception
export interface DakarZone {
  commune: string;
  department: 'Dakar' | 'Pikine' | 'Guédiawaye' | 'Rufisque' | 'Keur Massar';
  neighborhoods: string[];
}

export const DAKAR_ZONES: DakarZone[] = [
  // 1. DÉPARTEMENT DE DAKAR
  {
    commune: 'Dakar-Plateau / Centre-Ville',
    department: 'Dakar',
    neighborhoods: ['Plateau', 'Centre-Ville', 'Cap Manuel', 'Anse Bernard', 'Gare ferroviaire', 'Port autonome', 'Gorée']
  },
  {
    commune: 'Médina / Tilène',
    department: 'Dakar',
    neighborhoods: ['Médina', 'Marché Tilène', 'Avenue Blaise Diagne', 'Rond-Point Poste Médina', 'Rues 1 à 39']
  },
  {
    commune: 'Fass - Colobane - Gueule Tapée',
    department: 'Dakar',
    neighborhoods: ['Fass', 'Fass Delorme', 'Colobane', 'Marché Colobane', 'Gueule Tapée', 'Canal 4']
  },
  {
    commune: 'Fann - Point E - Amitié',
    department: 'Dakar',
    neighborhoods: ['Point E', 'Fann Résidence', 'Fann Hock', 'Amitié 1', 'Amitié 2', 'Amitié 3', 'Zone A', 'Zone B', 'Campus UCAD']
  },
  {
    commune: 'Mermoz - Sacré-Cœur',
    department: 'Dakar',
    neighborhoods: [
      'Mermoz',
      'Mermoz Ancienne Piste',
      'Sacré-Cœur 1',
      'Sacré-Cœur 2',
      'Sacré-Cœur 3',
      'Sacré-Cœur Pyrotechnie',
      'Cité Keur Gorgui'
    ]
  },
  {
    commune: 'Ouakam',
    department: 'Dakar',
    neighborhoods: ['Ouakam Village', 'Mamelles', 'Cité Avion', 'Comico Ouakam', 'Cité Touba Ouakam', 'Monument Renaissance']
  },
  {
    commune: 'Ngor',
    department: 'Dakar',
    neighborhoods: ['Ngor Village', 'Île de Ngor', 'Almadies', 'Pointe des Almadies', 'Zone Ambassades']
  },
  {
    commune: 'Yoff',
    department: 'Dakar',
    neighborhoods: ['Yoff Village', 'Yoff Tonghor', 'Yoff Virage', 'Nord Foire', 'Ouest Foire', 'APECSY', 'Cité BCEAO', 'Bambilor Yoff']
  },
  {
    commune: 'Sicap-Liberté',
    department: 'Dakar',
    neighborhoods: [
      'Liberté 1',
      'Liberté 2',
      'Liberté 3',
      'Liberté 4',
      'Liberté 5',
      'Liberté 6',
      'Liberté 6 Extension',
      'Sicap Baobabs',
      'Sicap Karack'
    ]
  },
  {
    commune: 'HLM',
    department: 'Dakar',
    neighborhoods: ['HLM 1', 'HLM 2', 'HLM 3', 'HLM 4', 'HLM 5', 'HLM 6', 'Marché HLM', 'HLM Montagne']
  },
  {
    commune: 'Grand Dakar',
    department: 'Dakar',
    neighborhoods: ['Grand Dakar', 'Niary Tally', 'Cerf-Volant', 'Cité Bissap', 'Zone de Captage']
  },
  {
    commune: 'Biscuiterie',
    department: 'Dakar',
    neighborhoods: ['Bopp', 'Biscuiterie', 'Ben Tally', 'Cité Port']
  },
  {
    commune: 'Dieuppeul - Derklé - Castors',
    department: 'Dakar',
    neighborhoods: ['Dieuppeul 1', 'Dieuppeul 2', 'Dieuppeul 3', 'Derklé', 'Castors', 'Marché Castors']
  },
  {
    commune: 'Hann Bel-Air / Maristes',
    department: 'Dakar',
    neighborhoods: ['Hann Maristes 1', 'Hann Maristes 2', 'Hann Bel-Air', 'Yarakh', 'Cité Marine', 'Zone Industrielle Bel-Air']
  },
  {
    commune: 'Grand Yoff',
    department: 'Dakar',
    neighborhoods: ['Grand Yoff', 'Khar Yalla', 'Arafat', 'Cité Millionnaire', 'Scat Urbam', 'Cité Sonatel']
  },
  {
    commune: 'Patte d\'Oie',
    department: 'Dakar',
    neighborhoods: ['Patte d\'Oie Builders', 'Cité Mixta', 'Grand Médine', 'Cité Impôts & Domaines', 'Résidence de la Paix']
  },
  {
    commune: 'Parcelles Assainies',
    department: 'Dakar',
    neighborhoods: [
      'Parcelles Unités 1 à 6',
      'Parcelles Unités 7 à 12',
      'Parcelles Unités 13 à 18',
      'Parcelles Unités 19 à 26',
      'Case Bi',
      'Dakar Bounkiling'
    ]
  },
  {
    commune: 'Cambérène',
    department: 'Dakar',
    neighborhoods: ['Cambérène 1', 'Cambérène 2', 'Plage de Cambérène', 'Cité Seydina Issa']
  },

  // 2. DÉPARTEMENT DE GUÉDIAWAYE
  {
    commune: 'Guédiawaye',
    department: 'Guédiawaye',
    neighborhoods: [
      'Golf Sud',
      'Sam Notaire',
      'Ndiarème Limamoulaye',
      'Wakhinane Nimzatt',
      'Médina Gounass',
      'Cité Aliou Sow',
      'Hamo 1 à 6'
    ]
  },

  // 3. DÉPARTEMENT DE PIKINE
  {
    commune: 'Pikine',
    department: 'Pikine',
    neighborhoods: [
      'Pikine Ouest',
      'Pikine Est',
      'Pikine Nord',
      'Guinaw Rails Nord',
      'Guinaw Rails Sud',
      'Dalifort',
      'Djidah Thiaroye Kao',
      'Thiaroye Gare',
      'Thiaroye sur Mer',
      'Tivaouane Diacksao',
      'Diamaguène Sicap Mbao',
      'Icotaf 1 & 2'
    ]
  },

  // 4. DÉPARTEMENT DE KEUR MASSAR
  {
    commune: 'Keur Massar',
    department: 'Keur Massar',
    neighborhoods: [
      'Keur Massar Nord',
      'Keur Massar Sud',
      'Jaxaay',
      'Parcelles Keur Massar',
      'Yeumbeul Nord',
      'Yeumbeul Sud',
      'Malika',
      'Malika Plage',
      'Boune',
      'Cité Gendarmerie Keur Massar'
    ]
  },

  // 5. DÉPARTEMENT DE RUFISQUE / ENTRAÎNEMENT
  {
    commune: 'Rufisque & Environs',
    department: 'Rufisque',
    neighborhoods: [
      'Rufisque Est',
      'Rufisque Ouest',
      'Rufisque Nord',
      'Bargny',
      'Sendou',
      'Sébikotane',
      'Diamniadio',
      'Sangalkam',
      'Bambylor',
      'Yenne'
    ]
  }
];

// Flat sorted list of all unique Dakar neighborhoods (sans exceptions)
export const ALL_DAKAR_NEIGHBORHOODS: string[] = Array.from(
  new Set(
    DAKAR_ZONES.flatMap((zone) => [
      zone.commune,
      ...zone.neighborhoods
    ])
  )
).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

// Quick popular shortcuts for primary filter buttons
export const PRIMARY_DAKAR_SHORTCUTS: string[] = [
  'Plateau',
  'Médina',
  'HLM',
  'Parcelles Assainies',
  'Almadies',
  'Ouakam',
  'Point E',
  'Sacré-Cœur',
  'Yoff',
  'Mermoz',
  'Hann Maristes',
  'Guédiawaye',
  'Pikine',
  'Keur Massar',
  'Rufisque'
];
