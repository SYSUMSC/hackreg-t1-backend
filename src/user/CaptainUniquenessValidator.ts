import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import MemberInfoDto from './MemberInfoDto';

@ValidatorConstraint({ name: 'captainUniqueness', async: false })
class CaptainUniquenessValidator implements ValidatorConstraintInterface {
  public validate(memberInfoList: MemberInfoDto[], args: ValidationArguments) {
    if (memberInfoList.length < 1) {
      return true;
    }
    let hasCaptain = false;
    for (const member of memberInfoList) {
      if (member.captain) {
        if (hasCaptain) {
          return false;
        } else {
          hasCaptain = true;
        }
      }
    }
    return hasCaptain;
  }
}

export default CaptainUniquenessValidator;
