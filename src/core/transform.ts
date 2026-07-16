import dayjs from 'dayjs';

const KEY_MAPPING: Record<string, string> = {
  codeMatiere: 'subjectCode',
  libelleMatiere: 'subjectLabel',
  matiere: 'subjectName',
  nomProf: 'teacherName',
  prof: 'teacherName',
  start_date: 'startDate',
  end_date: 'endDate',
  idDevoir: 'homeworkId',
  donneLe: 'givenOn',
  effectue: 'isDone',
  interrogation: 'isTest',
  rendreEnLigne: 'submitOnline',
  coef: 'coefficient',
  valeur: 'value',
  noteSur: 'outOf',
  codePeriode: 'periodCode',
  typeDevoir: 'testType',
  enLettre: 'isLetter',
  codeSousMatiere: 'subSubjectCode',
  libelleSousMatiere: 'subSubjectLabel',
  dateSaisie: 'entryDate',
  noteUniquementPeriodeCloture: 'gradeOnlyOnClosedPeriod',
  moyenne: 'average',
  moyenneClasse: 'classAverage',
  moyennes: 'averages',
  moyenneGenerale: 'overallAverage',
  periode: 'period',
  anneeScolaire: 'schoolYear',
  idPeriode: 'periodId',
  periodes: 'periods',
  annuel: 'isAnnual',
  dateDebut: 'startDate',
  dateFin: 'endDate',
  examenBlanc: 'isMockExam',
  cloture: 'isClosed',
  dateConseil: 'councilDate',
  heureConseil: 'councilTime',
  moyNbreJoursApresConseil: 'avgDaysAfterCouncil',
  ensembleMatieres: 'subjects',
  matieres: 'subjects',
  nomPP: 'headTeacher',
  disciplines: 'subjects',
  discipline: 'subject',
  effectif: 'classSize',
  rang: 'rank',
  groupeMatiere: 'subjectGroup',
  idGroupeMatiere: 'subjectGroupId',
  option: 'isOptional',
  sousMatiere: 'subSubject',
  saisieAppreciationSSMat: 'subSubjectAppreciationEnabled',
  professeurs: 'teachers',
  devoir: 'assignment',
  valeurisee: 'isCounted',
  nonSignificatif: 'isNotSignificant',
  elementsProgramme: 'programElements',
  descriptif: 'description',
  idElemProg: 'programElementId',
  idCompetence: 'competenceId',
  idConnaissance: 'knowledgeId',
  libelleCompetence: 'competenceLabel',
  parametrage: 'settings',
  couleurEval1: 'evalColor1',
  couleurEval2: 'evalColor2',
  couleurEval3: 'evalColor3',
  couleurEval4: 'evalColor4',
  libelleEval1: 'evalLabel1',
  libelleEval2: 'evalLabel2',
  libelleEval3: 'evalLabel3',
  libelleEval4: 'evalLabel4',
  affichageMoyenne: 'displayAverage',
  affichageMoyenneDevoir: 'displayGradeAverage',
  affichagePositionMatiere: 'displaySubjectRank',
  affichageOngletCompetence: 'displayCompetenceTab',
  affichageNote: 'displayGrade',
  affichageCompetence: 'displayCompetence',
  affichageEvaluationsComposantes: 'displayComponentEvaluations',
  affichageGraphiquesComposantes: 'displayComponentCharts',
  modeCalculGraphiquesComposantes: 'componentChartMode',
  affichageCompNum: 'displayCompNum',
  libelleEvalCompNum1: 'eval1Label',
  libelleEvalCompNum2: 'eval2Label',
  libelleEvalCompNum3: 'eval3Label',
  affichageAppreciation: 'displayAppreciation',
  coefficientNote: 'gradeCoefficient',
  colonneCoefficientMatiere: 'subjectCoefficientColumn',
  noteGrasSousMoyenne: 'boldBelowAverage',
  noteGrasAudessusMoyenne: 'boldAboveAverage',
  libelleDevoir: 'assignmentLabel',
  dateDevoir: 'assignmentDate',
  notePeriodeReleve: 'periodGradeReport',
  notePeriodeAnnuelle: 'annualPeriodGrade',
  notePeriodeHorsP: 'nonPeriodGrade',
  libellesAppreciations: 'appreciationLabels',
  appreciationsParametrage: 'appreciationSettings',
  nbMaxCaractere: 'maxCharacters',
  libelleElementProgramme: 'programElementLabel',
  isFirstOfMatiere: 'isFirstOfSubject',
  nbElemProgMatiere: 'subjectProgramElementCount',
  isFirstOfSousMatiere: 'isFirstOfSubSubject',
  nbElemProgSousMatiere: 'subSubjectProgramElementCount',
  typeCours: 'courseType',
  dispensable: 'isDispensable',
  dispense: 'dispensedCount',
  salle: 'room',
  classe: 'className',
  classeId: 'classId',
  classeCode: 'classCode',
  evenementId: 'eventId',
  groupe: 'group',
  groupeCode: 'groupCode',
  groupeId: 'groupId',
  isModifie: 'isModified',
  contenuDeSeance: 'sessionContent',
  devoirAFaire: 'hasHomework',
  isAnnule: 'isCancelled',
  accesstoken: 'accessToken',
  idLogin: 'loginId',
  typeCompte: 'accountType',
  nomEtablissement: 'schoolName',
  idEtablissement: 'schoolId',
  rneEtablissement: 'schoolRNE',
  telPortable: 'mobilePhone',
  portable: 'mobilePhone',
  photo: 'photoUrl',
  estApprenant: 'isLearner',
  lastConnexion: 'lastConnection',
  civilite: 'civility',
  prenom: 'firstName',
  nom: 'lastName',
  email: 'email',
  isPrimaire: 'isPrimary',
  logoEtablissement: 'schoolLogo',
  couleurAgendaEtablissement: 'schoolAgendaColor',
  questionSecrete: 'secretQuestion',
  reponse: 'answer',
  questionsPossibles: 'possibleQuestions',
  typeElement: 'elementType',
  titre: 'title',
  idElement: 'elementId',
  soustitre: 'subtitle',
  contenu: 'content',
  dateCreation: 'creationDate',
  postits: 'stickyNotes',
  auteur: 'author',
  idQcm: 'qcmId',
  idAssociation: 'associationId',
  idParticipant: 'participantId',
  idReponse: 'responseId',
  idQuestion: 'questionId',
  entityLibelle: 'entityLabel',
  blogActif: 'blogActive',
  nbJourMaxRenduDevoir: 'maxDaysToSubmit',
  documentsRendusDeposes: 'submittedDocuments',
  commentaires: 'comments',
  idAuteur: 'authorId',
  profilAuteur: 'authorProfile',
  supprime: 'isDeleted',
  mtype: 'type',
  read: 'isRead',
  to_cc_cci: 'recipientType',
  answered: 'isAnswered',
  transferred: 'isTransferred',
  canAnswer: 'canAnswer',
  classeurs: 'binders',
  idDossier: 'folderId',
  idClasseur: 'binderId',
  brouillon: 'isDraft',
  fonctionPersonnel: 'staffRole',
  isActif: 'isActive',
  destAdmin: 'adminRecipients',
  destEleve: 'studentRecipients',
  destFamille: 'familyRecipients',
  destProf: 'teacherRecipients',
  destEspTravail: 'workspaceRecipients',
  destEntreprise: 'companyRecipients',
  choixMailNotification: 'emailNotificationChoice',
  autreMailNotification: 'otherNotificationEmail',
  messagerieApiVersion: 'messagingApiVersion',
  blackListProfActive: 'teacherBlacklistActive',
  estEnBlackList: 'isBlacklisted',
  messagesRecusCount: 'receivedMessagesCount',
  messagesEnvoyesCount: 'sentMessagesCount',
  messagesArchivesCount: 'archivedMessagesCount',
  messagesRecusNotReadCount: 'unreadReceivedCount',
  messagesDraftCount: 'draftMessagesCount',
  libelle: 'label',
  taille: 'size',
  readonly: 'isReadOnly',
  hidden: 'isHidden',
  isTrash: 'isTrash',
  displayText: 'displayText',
  proprietaire: 'owner',
  aFaire: 'toDo',
  documentsAFaire: 'documentsToDo',
  typeJustification: 'justificationType',
  justifie: 'isJustified',
  pointsPermis: 'licensePoints',
  absencesRetards: 'attendance',
  idEleve: 'studentId',
  motif: 'reason',
  justifieEd: 'justifiedOnline',
  dontNeedJustifiePrim: 'dontNeedJustification',
  jour: 'day',
  permisPoint: 'points',
  idPermis: 'id',
  justificationEnLigne: 'onlineJustification',
  absenceCommentaire: 'absenceComment',
  retardCommentaire: 'lateComment',
  sanctionParQui: 'sanctionByWho',
  sanctionCommentaire: 'sanctionComment',
  encouragementParQui: 'encouragementByWho',
  encouragementCommentaire: 'encouragementComment',
  afficherPermisPoint: 'displayPoints',
  commentaire: 'comment',
  notes: 'grades',
  signatureDemandee: 'signatureRequired',
  administratifs: 'administratives',
  listesPiecesAVerser: 'toUploadList',
  listePiecesAVerser: 'toUploadList',
  personnes: 'people',
  listeRouge: 'blackList',
  canParentsLireMessagesEnfants: 'parentsCanRead',
  afficherToutesLesClasses: 'displayAllClasses',
  niveauMDPAutorise: 'minPasswordLevel',
  foStat: 'statistics',
  entityCode: 'entityCode',
  entityType: 'entityType',
  cdt: 'textbook',
  afc: 'foundationalSkills',
};

function renameKey(key: string): string {
  return KEY_MAPPING[key] || key;
}

const BASE64_CONTENT_KEYS = new Set(['content']);

export function decodeBase64Content(value: string): string {
  if (value.length < 20) return value;
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return value;
  }
}

function isDateString(value: any): boolean {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}(\s|T)?(\d{2}:\d{2}(:\d{2})?)?$/.test(value);
}

function convertDate(value: string): Date | string {
  const d = dayjs(value);
  return d.isValid() ? d.toDate() : value;
}

export function transform(data: any): any {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    if (data.length === 0) return data;
    return data.map(transform).filter((v) => v !== null && v !== undefined);
  }

  if (typeof data === 'object') {
    if (data instanceof Date) return data;

    const result: any = {};
    for (const key in data) {
      let value = data[key];

      if (value === null || value === undefined) {
        if (key === 'moyenne' || key === 'valeur' || key === 'val') {
        } else {
          continue;
        }
      }

      const newKey = renameKey(key);

      if (
        (newKey.startsWith('is') || newKey === 'enable' || newKey === 'main') &&
        (value === '0' || value === '1' || value === 0 || value === 1)
      ) {
        value = value === '1' || value === 1;
      }

      if (isDateString(value)) {
        value = convertDate(value);
      } else if (typeof value === 'string' && BASE64_CONTENT_KEYS.has(newKey)) {
        value = decodeBase64Content(value);
      } else {
        value = transform(value);
      }

      result[newKey] = value;
    }
    return result;
  }

  return data;
}
