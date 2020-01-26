interface IUserPasswordResetToken {
    id: string;
    token: string;
    expire: number;
}

export default IUserPasswordResetToken;
