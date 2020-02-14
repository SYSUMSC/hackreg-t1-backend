import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

const passwordRegex = /[A-Z0-9#@!~%^&*]{8,30}/i;

@ValidatorConstraint({ name: 'customPassword', async: false })
class CustomPasswordValidator implements ValidatorConstraintInterface {
  public validate(text: string, args: ValidationArguments) {
    return passwordRegex.test(text);
  }
}

export default CustomPasswordValidator;
