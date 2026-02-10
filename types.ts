
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  password: string; // Nova propriedade
  rpName: string;
  balance: number;
  role: UserRole;
  createdAt: number;
}

export interface Animal {
  id: number;
  name: string;
  numbers: number[];
  multiplier: number;
  icon: string;
}

export interface Bet {
  id: string;
  userId: string;
  animalId: number;
  amount: number;
  drawId: string | null;
  status: 'PENDING' | 'WON' | 'LOST';
  potentialWin: number;
  createdAt: number;
}

export interface Draw {
  id: string;
  drawTime: number;
  winningNumber: number | null;
  winningAnimalId: number | null;
  status: 'SCHEDULED' | 'COMPLETED';
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  bets: Bet[];
  draws: Draw[];
  animals: Animal[];
}
