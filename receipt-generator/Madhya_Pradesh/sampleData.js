const path = require('path');

module.exports = {
  documentTitle: 'CheckPost V4.7.3',
  documentUrl: 'https://services.parivahan.gov.in/checkpostv4/#/public/repor...',
  browserPrintedAt: '08/07/26, 15:28',
  printedOn: '08-JUL-2026 03:28:10 PM',
  registrationNo: 'AR01Y5050',
  receiptNo: 'MPR2607080396778',
  watermarkDate: '08-Jul-2026 03:27 PM',
  paymentInitializationDate: '08-Jul-2026, 3:27:10 PM',
  paymentConfirmationDate: '08-Jul-2026, 3:28:09 PM',
  ownerName: 'G****D S********I',
  chassisNo: 'MB1PREFD3GGF*****',
  taxMode: 'DAYS',
  vehicleType: 'TRANSPORT',
  vehicleClass: 'BUS',
  vehicleCategory: 'HEAVY PASSENGER VEHICLE',
  mobileNo: '89998****1',
  checkpostName: 'MAJHGAWAN',
  seatingCapacity: 1,
  sleeperCapacity: 48,
  bankReferenceNo: '618928660433',
  paymentMode: 'ONLINE',
  permitNumber: 'AR2024-AITP-0009A',
  permitValidity: '05-JUN-2026',
  fitnessValidity: '17-OCT-2026',
  insuranceValidity: '05-MAR-2027',
  puccValidity: '07-JAN-2027',
  roadTaxValidity: '',
  serviceType: 'Sleeper AC Service',
  permitType: 'TEMPORARY PERMIT',
  standingCapacity: 0,
  grossCombinationWeight: 0,
  grossVehicleWeight: 16200,
  routesOrArea: 'Madhya Pradesh State',
  purposeOfJourney:
    '87(1)(A)- Will be granted for short period (FOR Passenger Vehicle)',
  permitIssueDate: '08-Jul-2026, 3:27 PM',
  formName: 'FORM MPMVR-51 (T.P.)',
  ruleReference: '[See Rule 73(1)(d)]',
  grantHeading:
    'A: 87(1)(A)- WILL BE GRANTED FOR SHORT PERIOD (FOR PASSENGER VEHICLE).',
  taxItems: [
    {
      particular: 'Permit Fee ( 2026-07-08 To 2026-07-08 )',
      fees: 600,
      fine: 0,
      total: 600
    },
    {
      particular: 'MV Tax ( 2026-07-08 To 2026-07-08 )',
      fees: 2450,
      fine: 0,
      total: 2450
    },
    {
      particular: 'Service/User Charge ( 2026-07-08 To 2026-07-08 )',
      fees: 27,
      fine: 0,
      total: 27
    },
    {
      particular: 'SGST ( 2026-07-08 To 2026-07-08 )',
      fees: 3,
      fine: 0,
      total: 3
    },
    {
      particular: 'CGST ( 2026-07-08 To 2026-07-08 )',
      fees: 3,
      fine: 0,
      total: 3
    }
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.'
  ],
  preserveReferenceTermBreaks: true,
  emblemImagePath: path.join(
    __dirname,
    'assets',
    'madhya-pradesh-emblem.png'
  ),
  referenceWatermarkImagePath: path.join(
    __dirname,
    'assets',
    'reference-watermark.png'
  ),
  qrImagePath: path.join(__dirname, 'assets', 'reference-qr.png'),
  qrValue: 'MPR2607080396778'
};
