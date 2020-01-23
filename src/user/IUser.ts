interface IUser {
    _id: string;
    email: string;
    password: string;
    confirmed: boolean;
    form: {
        teamName: string,
        teamDescription: string,
        memberInfo: [] | [{
            name: string,
            gender: number,
            captain: boolean,
            email: string,
            phone: string,
            size: number,
            school: string,
            education: number,
            grade: string,
            profession: string,
            experience: string,
        }];
    };
}

export default IUser;
