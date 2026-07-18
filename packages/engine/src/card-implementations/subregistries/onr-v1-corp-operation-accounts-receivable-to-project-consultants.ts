import type { CardImplementationDefinition } from "../types";
import { accountsReceivableImplementation } from "../onr-v1/corp/operations/accounts-receivable";
import { annualReviewsImplementation } from "../onr-v1/corp/operations/annual-reviews";
import { auditOfCallRecordsImplementation } from "../onr-v1/corp/operations/audit-of-call-records";
import { chanceObservationImplementation } from "../onr-v1/corp/operations/chance-observation";
import { closedAccountsImplementation } from "../onr-v1/corp/operations/closed-accounts";
import { corporateDetectiveAgencyImplementation } from "../onr-v1/corp/operations/corporate-detective-agency";
import { datapoolByZetatechImplementation } from "../onr-v1/corp/operations/datapool-by-zetatech";
import { dayShiftImplementation } from "../onr-v1/corp/operations/day-shift";
import { edgerunnerIncTempsImplementation } from "../onr-v1/corp/operations/edgerunner-inc-temps";
import { efficiencyExpertsImplementation } from "../onr-v1/corp/operations/efficiency-experts";
import { falsifiedTransactionsExpertImplementation } from "../onr-v1/corp/operations/falsified-transactions-expert";
import { managementShakeUpImplementation } from "../onr-v1/corp/operations/management-shake-up";
import { netwatchCreditVoucherImplementation } from "../onr-v1/corp/operations/netwatch-credit-voucher";
import { newBloodImplementation } from "../onr-v1/corp/operations/new-blood";
import { nightShiftImplementation } from "../onr-v1/corp/operations/night-shift";
import { offSiteBackupsImplementation } from "../onr-v1/corp/operations/off-site-backups";
import { overtimeIncentivesImplementation } from "../onr-v1/corp/operations/overtime-incentives";
import { planningConsultantsImplementation } from "../onr-v1/corp/operations/planning-consultants";
import { powerGridOverloadImplementation } from "../onr-v1/corp/operations/power-grid-overload";
import { projectConsultantsImplementation } from "../onr-v1/corp/operations/project-consultants";

export const ONR_V1_CORP_OPERATION_ACCOUNTS_RECEIVABLE_TO_PROJECT_CONSULTANTS_IMPLEMENTATIONS =
  [
    accountsReceivableImplementation,
    annualReviewsImplementation,
    auditOfCallRecordsImplementation,
    chanceObservationImplementation,
    closedAccountsImplementation,
    corporateDetectiveAgencyImplementation,
    datapoolByZetatechImplementation,
    dayShiftImplementation,
    edgerunnerIncTempsImplementation,
    efficiencyExpertsImplementation,
    falsifiedTransactionsExpertImplementation,
    managementShakeUpImplementation,
    netwatchCreditVoucherImplementation,
    newBloodImplementation,
    nightShiftImplementation,
    offSiteBackupsImplementation,
    overtimeIncentivesImplementation,
    planningConsultantsImplementation,
    powerGridOverloadImplementation,
    projectConsultantsImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
