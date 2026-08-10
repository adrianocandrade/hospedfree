import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {Trans} from '@ui/i18n/trans';

interface CaptchaContainerProps {
  className?: string;
}
export function CaptchaContainer({className}: CaptchaContainerProps) {
  const {label} = getInputFieldClassNames();
  return (
    <div className={className}>
      <div className={label}>
        <Trans message="Confirme que você não é um robô" />
      </div>
      <div id="captcha-container" className="h-16 w-75" />
    </div>
  );
}
