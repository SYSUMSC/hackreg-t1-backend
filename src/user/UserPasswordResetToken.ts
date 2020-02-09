interface UserPasswordResetToken {
  id: string;
  token: string;
  expire: number;
}

export default UserPasswordResetToken;
