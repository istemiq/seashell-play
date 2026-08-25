import { loadSettings } from '../utils/settings.js';
import { getStudyModuleCode } from '../modules/learnModuleSwitch.js';
import { EnCardTranslationLocalePicker } from './EnCardTranslationLocalePicker.jsx';
import { RuCardTranslationLocalePicker } from './RuCardTranslationLocalePicker.jsx';
import { ArCardTranslationLocalePicker } from './ArCardTranslationLocalePicker.jsx';
import { EsCardTranslationLocalePicker } from './EsCardTranslationLocalePicker.jsx';
import { PtCardTranslationLocalePicker } from './PtCardTranslationLocalePicker.jsx';
import { ItCardTranslationLocalePicker } from './ItCardTranslationLocalePicker.jsx';
import { ElCardTranslationLocalePicker } from './ElCardTranslationLocalePicker.jsx';
import { FaCardTranslationLocalePicker } from './FaCardTranslationLocalePicker.jsx';
import { DaCardTranslationLocalePicker } from './DaCardTranslationLocalePicker.jsx';
import { NlCardTranslationLocalePicker } from './NlCardTranslationLocalePicker.jsx';
import { FrCardTranslationLocalePicker } from './FrCardTranslationLocalePicker.jsx';
import { DeCardTranslationLocalePicker } from './DeCardTranslationLocalePicker.jsx';
import { TrCardTranslationLocalePicker } from './TrCardTranslationLocalePicker.jsx';
import { SvCardTranslationLocalePicker } from './SvCardTranslationLocalePicker.jsx';
import { NoCardTranslationLocalePicker } from './NoCardTranslationLocalePicker.jsx';
import { FiCardTranslationLocalePicker } from './FiCardTranslationLocalePicker.jsx';
import { KoCardTranslationLocalePicker } from './KoCardTranslationLocalePicker.jsx';
import { JaCardTranslationLocalePicker } from './JaCardTranslationLocalePicker.jsx';
import { ZhCardTranslationLocalePicker } from './ZhCardTranslationLocalePicker.jsx';
import { UkCardTranslationLocalePicker } from './UkCardTranslationLocalePicker.jsx';
import { PlCardTranslationLocalePicker } from './PlCardTranslationLocalePicker.jsx';
import { HiCardTranslationLocalePicker } from './HiCardTranslationLocalePicker.jsx';
import { UrCardTranslationLocalePicker } from './UrCardTranslationLocalePicker.jsx';
import { AzCardTranslationLocalePicker } from './AzCardTranslationLocalePicker.jsx';
import { UgCardTranslationLocalePicker } from './UgCardTranslationLocalePicker.jsx';
import { ViCardTranslationLocalePicker } from './ViCardTranslationLocalePicker.jsx';
import { CsCardTranslationLocalePicker } from './CsCardTranslationLocalePicker.jsx';
import { HuCardTranslationLocalePicker } from './HuCardTranslationLocalePicker.jsx';
import { RoCardTranslationLocalePicker } from './RoCardTranslationLocalePicker.jsx';
import { IdCardTranslationLocalePicker } from './IdCardTranslationLocalePicker.jsx';
import { HeCardTranslationLocalePicker } from './HeCardTranslationLocalePicker.jsx';
import { CaCardTranslationLocalePicker } from './CaCardTranslationLocalePicker.jsx';
import { SrCardTranslationLocalePicker } from './SrCardTranslationLocalePicker.jsx';

const PICKERS = {
  ru: RuCardTranslationLocalePicker,
  ar: ArCardTranslationLocalePicker,
  es: EsCardTranslationLocalePicker,
  pt: PtCardTranslationLocalePicker,
  it: ItCardTranslationLocalePicker,
  el: ElCardTranslationLocalePicker,
  fa: FaCardTranslationLocalePicker,
  da: DaCardTranslationLocalePicker,
  nl: NlCardTranslationLocalePicker,
  fr: FrCardTranslationLocalePicker,
  de: DeCardTranslationLocalePicker,
  tr: TrCardTranslationLocalePicker,
  sv: SvCardTranslationLocalePicker,
  no: NoCardTranslationLocalePicker,
  fi: FiCardTranslationLocalePicker,
  ko: KoCardTranslationLocalePicker,
  ja: JaCardTranslationLocalePicker,
  zh: ZhCardTranslationLocalePicker,
  uk: UkCardTranslationLocalePicker,
  pl: PlCardTranslationLocalePicker,
  hi: HiCardTranslationLocalePicker,
  ur: UrCardTranslationLocalePicker,
  az: AzCardTranslationLocalePicker,
  ug: UgCardTranslationLocalePicker,
  vi: ViCardTranslationLocalePicker,
  cs: CsCardTranslationLocalePicker,
  hu: HuCardTranslationLocalePicker,
  ro: RoCardTranslationLocalePicker,
  id: IdCardTranslationLocalePicker,
  he: HeCardTranslationLocalePicker,
  ca: CaCardTranslationLocalePicker,
  sr: SrCardTranslationLocalePicker,
};

/** Маршрутизатор: модули не знают друг о друге. */
export function CardTranslationLocalePicker({
  learnLocale = loadSettings().learnLocale,
  ...props
}) {
  const code = getStudyModuleCode(learnLocale);
  const Picker = PICKERS[code] ?? EnCardTranslationLocalePicker;
  return <Picker {...props} />;
}

export { EnCardTranslationLocalePicker } from './EnCardTranslationLocalePicker.jsx';
export { RuCardTranslationLocalePicker } from './RuCardTranslationLocalePicker.jsx';
export { ArCardTranslationLocalePicker } from './ArCardTranslationLocalePicker.jsx';
export { EsCardTranslationLocalePicker } from './EsCardTranslationLocalePicker.jsx';
export { PtCardTranslationLocalePicker } from './PtCardTranslationLocalePicker.jsx';
export { ItCardTranslationLocalePicker } from './ItCardTranslationLocalePicker.jsx';
export { ElCardTranslationLocalePicker } from './ElCardTranslationLocalePicker.jsx';
export { FaCardTranslationLocalePicker } from './FaCardTranslationLocalePicker.jsx';
export { DaCardTranslationLocalePicker } from './DaCardTranslationLocalePicker.jsx';
export { NlCardTranslationLocalePicker } from './NlCardTranslationLocalePicker.jsx';
export { FrCardTranslationLocalePicker } from './FrCardTranslationLocalePicker.jsx';
export { DeCardTranslationLocalePicker } from './DeCardTranslationLocalePicker.jsx';
export { TrCardTranslationLocalePicker } from './TrCardTranslationLocalePicker.jsx';
export { SvCardTranslationLocalePicker } from './SvCardTranslationLocalePicker.jsx';
export { NoCardTranslationLocalePicker } from './NoCardTranslationLocalePicker.jsx';
export { FiCardTranslationLocalePicker } from './FiCardTranslationLocalePicker.jsx';
export { KoCardTranslationLocalePicker } from './KoCardTranslationLocalePicker.jsx';
export { JaCardTranslationLocalePicker } from './JaCardTranslationLocalePicker.jsx';
export { ZhCardTranslationLocalePicker } from './ZhCardTranslationLocalePicker.jsx';
export { UkCardTranslationLocalePicker } from './UkCardTranslationLocalePicker.jsx';
export { PlCardTranslationLocalePicker } from './PlCardTranslationLocalePicker.jsx';
export { HiCardTranslationLocalePicker } from './HiCardTranslationLocalePicker.jsx';
export { UrCardTranslationLocalePicker } from './UrCardTranslationLocalePicker.jsx';
export { AzCardTranslationLocalePicker } from './AzCardTranslationLocalePicker.jsx';
export { UgCardTranslationLocalePicker } from './UgCardTranslationLocalePicker.jsx';
export { ViCardTranslationLocalePicker } from './ViCardTranslationLocalePicker.jsx';
export { CsCardTranslationLocalePicker } from './CsCardTranslationLocalePicker.jsx';
export { HuCardTranslationLocalePicker } from './HuCardTranslationLocalePicker.jsx';
export { RoCardTranslationLocalePicker } from './RoCardTranslationLocalePicker.jsx';
export { IdCardTranslationLocalePicker } from './IdCardTranslationLocalePicker.jsx';
export { HeCardTranslationLocalePicker } from './HeCardTranslationLocalePicker.jsx';
export { CaCardTranslationLocalePicker } from './CaCardTranslationLocalePicker.jsx';
export { SrCardTranslationLocalePicker } from './SrCardTranslationLocalePicker.jsx';
