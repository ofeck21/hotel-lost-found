export type RemarkType = "Azana" | "FrontOne";
export type PickupStatus = "Belum Diambil" | "Sudah Diambil";

export interface LostFoundItem {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  itemName: string;
  itemPhoto: string;
  roomNumber: string;
  remark: RemarkType;
  createdBy: string;
  pickupHandle: string;
  pickupDocumentation: string;
  status: PickupStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LostFoundPayload {
  guestName: string;
  checkIn: string;
  checkOut: string;
  itemName: string;
  itemPhoto: string;
  roomNumber: string;
  remark: RemarkType;
  createdBy: string;
  pickupHandle: string;
  pickupDocumentation: string;
  status: PickupStatus;
}
