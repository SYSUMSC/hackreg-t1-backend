interface IUser {
    _id: string;
    email: string;
    password: string;
    confirmed: boolean;
    form: {
        teamName: string,
        teamDescription: string,
        memberInfo: Array<{
            name: string,
            gender: string,
            captain: boolean,
            email: string,
            phone: string,
            size: string,
            school: string,
            education: string,
            grade: string,
            profession: string,
            experience: string,
        }>;
    };
}

export default IUser;
