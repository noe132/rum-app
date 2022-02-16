export const content = {
  refresh: 'Reload',
  reload: 'restart',
  reloadForUpdate: 'Restart for Update',
  checkForUpdate: 'Update',
  dev: 'Debug',
  devtools: 'Toggle Devtools',
  modeToggle: 'Switch Internal/External Mode',
  exportLogs: 'Export Logs',
  clearCache: 'Clear Local Cache',
  relaunch: 'relaunch',
  help: 'Help',
  manual: 'Manual',
  report: 'Report Issues',
  about: 'About Rum',
  switchLang: 'Change Language',
  exportKey: 'Export Key',
  importKey: 'Import Key',
  allSeedNets: 'All SeedNets',
  noSeedNetSearchResult: 'No SeedNets matching found',
  filterByType: 'Filter by Template',
  share: 'share',
  shareSeed: 'Share Seed',
  seedNet: 'SeedNet',
  info: 'Details',
  exit: 'Exit',
  name: 'Name',
  owner: 'Owner',
  highestBlockId: 'Latest block',
  highestHeight: 'Number of blocks',
  lastUpdated: 'Last Updated',
  status: 'Status',
  groupInfo: 'SeedNet details',
  joinGroup: 'Add existing seed',
  joinSeedGroup: 'Join This SeedNet',
  openSeedGroup: 'Open This SeedNet',
  createGroup: 'Create SeedNet',
  welcomeToUseRum: 'Welcome to Rum',
  youCanTry: 'You can try',
  noTypeGroups: 'There is no SeedNet of this type',
  selectSeedFile: 'Select seed file',
  selectedSeedFile: 'Seed file is selected',
  selectSeedToJoin: 'Select the seed file to join the SeedNet',
  seedParsingError: 'Parsing seed failed',
  selectKeyBackupFile: 'Select backup file',
  selectedKeyBackupFile: 'Backup file is selected',
  selectKeyBackupToImport: 'Select the backup file to import the Key',
  or: 'Or',
  paste: 'Paste text',
  pasteSeedText: 'Paste seed text',
  pasteKeyBackupText: 'Paste key backup text',
  yes: 'yes',
  availablePublicGroups: 'Available public SeedNets for joining? ',
  chooseTemplate: 'Select by template',
  groupTypeDesc: 'The template will determine how members could distribute and interact with information and content in the SeedNet you create. Each template is specifically designed and optimized for its usage, and will be different in terms of publishing functions, economic systems, social relationships, administrator permissions, member management and other functions. ',
  sns: 'Feed/Timeline',
  forum: 'BBS',
  note: 'Note',
  notebook: 'Notebook',
  all: 'All',
  allType: 'All Type',
  joined: 'Joined',
  created: 'Created successfully',
  existMember: 'You are already a member of this SeedNet ',
  document: 'Document',
  snsDesc: "A SNS template similar to Twitter.  All posts are presented on the timeline and public to all members in this SeedNet. Every members can post short text or photos, or leave comments,like and reward others' post. Someone can be muted from one's timeline or this SeedNet. A certain amount of post fee can be set by hosts.",
  forumDesc: 'A forum or message board template similar to Reddit. Post can be organized by host-created categories. All members can submit posts that are then liked up or down by other members. Six layers of replies are supported under each post to encourage In-depth discussions. A certain amount of post fee and reply fee can be set by hosts. ',
  noteDesc: 'A private notebook template. Only hosts or members with permission can submit or read/decrypt notes. All notes are encrypted and stored on the chain, can be used as private notebook, multi-author diary or for archiving and encrypting docs.  Hosts can self-build several nodes to maintain a small private SeedNet to backup and synchronous data in a decentralized way. ',
  cancel: 'Cancel',
  save: 'Save',
  saved: 'Saved',
  savedAndWaitForSyncing: 'Saved and wait for syncing',
  storageDir: 'Data Storage folder',
  nodeParams: 'Params',
  version: 'Version',
  networkStatus: 'Network',
  myNode: 'My Node',
  connectedNodes: (n: number) => `${n} nodes connected`,
  failToSync: 'Sync failed',
  comment: 'Comment',
  reply: 'Reply',
  noMessages: 'No messages received yet ~',
  receiveNewContent: 'Receive new content',
  ago: '1 hour ago',
  anyIdeas: 'What are you doing?',
  publish: 'Post',
  publishFirstTimeline: 'Publish your first content',
  publishFirstPost: 'Publish your first post',
  back: 'Back',
  backOneStep: 'Back one step',
  input: (name: string) => `Please enter ${name}`,
  title: 'Title',
  content: 'Content',
  delete: 'Delete',
  deleted: 'Deleted',
  exited: 'Exited',
  somethingWrong: 'It looks like something went wrong',
  confirmToExit: 'Are you sure to exit this SeedNet ? ',
  confirmToExitAll: 'Are you sure to exit these SeedNets ? ',
  confirmToDelete: 'Are you sure you want to delete this SeedNet ? ',
  settingDone: 'Setting successfully saved',
  confirmToUnBan: 'Are you sure to display content posted by this member? ',
  confirmToBan: 'Are you sure to ban this user from posting in this SeedNet ? ',
  submittedWaitForSync: 'The request has been submitted, waiting for other nodes to synchronize',
  confirmToDelDenied: 'Are you sure to allow this user from posting in this SeedNet ? ',
  unFollowHim: 'Mute',
  followHim: 'Follow',
  blockInfo: 'Block Details',
  sender: 'Sender',
  group: 'SeedNet ',
  data: 'Data',
  sign: 'Signature',
  timestamp: 'Timestamp',
  failToLoad: 'Failed to load',
  idle: 'Idle',
  syncing: 'Syncing',
  syncFailed: 'Sync failed',
  require: (name: string) => `Please enter ${name}`,
  requireMinLength: (name: string, length: number) => `${name} must enter at least ${length} characters`,
  requireMaxLength: (name: string, length: number) => `${name} cannot exceed ${length} characters`,
  notFound: (name: string) => `${name} does not exist`,
  groupName: 'SeedNet name',
  desc: 'Description',
  groupDesc: 'SeedNet Description',
  connected: 'Connected',
  failToFetchMixinProfile: 'Failed to obtain Mixin Profile',
  connectMixinPrivacyTip: 'Your Mixin Account will be exposed to who transfer money to you. In the future, we will provide a more anonymous transfer method to Improve privacy ',
  tipByMixinPrivacyTip: 'Your Mixin Account will be exposed to whom you pay rewards to. In the future, we will provide a more anonymous transfer method to Improve privacy ',
  mixinScanToConnect: 'Use Mixin to scan QR Code to connect your wallet',
  noMixinOnYourPhone: "Hasn't installed Mixin yet?",
  toDownload: 'Mixin App download',
  waitForSyncingDoneToSubmitProfile: 'The SeedNet is synchronizing, you can edit the profile after completion',
  waitForSyncingDone: 'Your profile has been submitted, is being synchronized, it will be updated after completion',
  syncFailedTipForProfile: 'Synchronization of seed data failed, unable to update profile',
  waitForSyncingDoneToSubmit: 'The seed data is being synchronized. You can post after completion',
  syncFailedTipForSubmit: 'Seed data synchronization failed, unable to post content',
  editProfile: 'Edit Profile',
  nickname: 'Nickname',
  connectMixinForTip: 'Link to Mixin wallet to receive rewards',
  connectWallet: 'Link Wallet',
  bindWallet: 'Bind Wallet',
  bindNewWallet: 'Bind New Wallet',
  connectedMixinId: (id: string) => `Link to the Mixin wallet, the address is ${id}`,
  beBannedTip: 'The hosts has banned you from posting',
  beBannedTip2: 'You have been banned by hosts from posting, you need to be allowed to post and view new content',
  beBannedTip3: 'Ta is banned and the content cannot be displayed',
  beBannedTip4: 'Posting content has been banned',
  beBannedTip6: 'You have been banned and the posts cannot be displayed',
  andNewIdea: 'Any thoughts? ',
  copy: 'Copy',
  copied: 'copied',
  copySeed: 'Copy the seed',
  copySeedOr: 'or',
  downloadSeed: 'Download seed file',
  downloadedThenShare: 'downloaded, go to share with your friends',
  copyBackup: 'Please copy the backup content or download the backup file directly',
  downloadBackup: 'Download backup file',
  downloadedBackup: 'downloaded',
  exitNode: 'Exit Node',
  exitConfirmTextWithGroupCount: (ownerGroupCount: number) => `The ${ownerGroupCount} SeedNet you hosted needs you to keep generating blocks. If your node goes offline, this SeedNet will fail to post new content. Are you sure to exit ? `,
  exitConfirmText: 'Your node is about to go offline, are you sure to exit ? ',
  syncingContentTip: 'Checking and synchronizing the latest posts in the SeedNet , please wait patiently',
  syncingContentTip2: 'Syncing to other nodes',
  invalidPassword: 'Wrong password, please re-enter',
  failToStartNode: 'The node failed to start, please try again',
  reEnter: 'Re-enter',
  reset: 'Reset',
  hasReset: 'Reset',
  failToAccessExternalNode: (host: string, port: string) => `The development node cannot be accessed, please check it<br />${host}: ${port}`,
  tryAgain: 'Try again',
  tipped: 'Rewarded successfully!',
  search: 'Search',
  selectToken: 'Select currency',
  selectOtherToken: 'Select other currency',
  tipTo: 'Reward to',
  amount: 'Amount',
  tipNote: 'Notes',
  optional: 'Optional',
  next: 'Next',
  mixinPay: 'Use Mixin to scan code to pay',
  scanQrCodeByMixin: 'Please use Mixin to scan the QR code',
  willRefreshAfterPayment: 'The page will automatically refresh after the payment is successful',
  exiting: 'Node is exiting',
  connectedPeerCount: (count: number) => `Connected ${count} nodes`,
  connectedPeerCountTip: (count: number) => `Your node is connected to ${count} nodes in the network`,
  signupNode: 'Build node',
  signupNodeTip: 'First time use',
  loginNode: 'Login Node',
  loginNodeTip: 'Already have a node',
  setExternalNode: 'Set an external node',
  port: 'Port',
  tslCert: 'tls certificate',
  failToOpenFile: 'Failed to read the file! ',
  startingNodeTip1: 'Starting node',
  startingNodeTip2: 'Connected successfully, initializing, please wait',
  startingNodeTip3: 'coming soon',
  startingNodeTip4: 'Working hard to load',
  startingNodeTip5: 'Trying to connect to the network, please wait',
  updatingQuorum: 'Update service',
  nodeDataNotExist: 'There is no node data in this folder, please select again',
  keyStoreNotExist: 'The folder has no keystore',
  deprecatedNodeData: 'This folder was generated by the old version, it is not supported now, please recreate it',
  externalNode: 'External Node',
  externalMode: 'External Mode',
  externalNodeTip: 'Connect to available node',
  selectExternalNodeStoragePathTip1: 'External node will create some data',
  selectExternalNodeStoragePathTip2: 'Select a folder to save it',
  storagePathTip1: 'Please select a folder to store node data',
  storagePathTip2: 'This data belongs to you only',
  storagePathTip3: 'We do not store your data, so we cannot retrieve it for you.',
  storagePathTip4: 'Please keep it in a safe place',
  storagePathLoginTip1: 'You selected a folder when building a node',
  storagePathLoginTip2: 'where your node information is stored',
  storagePathLoginTip3: 'Please reselect this folder',
  storagePathLoginTip4: 'to log in to this node',
  edit: 'Modify',
  selectFolder: 'Select Folder',
  tip: 'Reward',
  contentCount: (count: number) => `${count} posts`,
  confirmToExitNode: 'Are you sure to exit the node? ',
  nodeInfo: 'Node Info',
  nodeAndNetwork: 'Node and Network',
  savePassword: 'Remember password',
  savePasswordTip: 'No need to re-enter the password every time you open',
  confirmPassword: 'Confirm Password',
  enterNewPassword: 'Set password',
  enterPassword: 'Enter password',
  password: 'Password',
  passwordNotMatch: 'Password do not match',
  unableToUseAutoUpdate: 'Check for update failed, you can contact us to download the latest version',
  gotIt: 'I got it',
  unableToDownloadUpdate: 'Something went wrong with the automatic update, please click to download',
  download: 'Download',
  updateNextTime: 'Skip this update',
  newVersion: 'New Version',
  published: 'Published',
  update: 'Update',
  doItLater: 'Do it later',
  reloadAfterDownloaded: 'Updated version has been downloaded, restart to use',
  isLatestVersion: 'Currently is the latest version',
  downloadingNewVersionTip: 'A new version is available and downloading. You will be notified to install and restart after completion',
  downloadingNewVersion: 'Downloading a new version',
  clickToSync: 'Click to synchronize the latest content',
  myHomePage: 'My Home Page',
  like: 'Like',
  open: 'Click to view more',
  lastReadHere: 'Last Read Here',
  replyYourComment: 'Replied to your comment',
  replyYourContent: 'Commented your content',
  likeFor: (name: string) => `Like your ${name}`,
  object: 'Post',
  empty: (name: string) => `No ${name}`,
  message: 'Message',
  afterUnFollowTip: 'Blocked, click the menu in the upper right corner to view member muted',
  confirmToUnFollow: 'Are you sure you want to mute this member? ',
  ban: 'Ban',
  banned: 'Banned',
  unban: 'Unban',
  banReason: 'Banned reason',
  banReasonTip: 'reason (optional)',
  checkMoreComments: (count: number) => `${count} comments, click to view`,
  expandComments: (count?: number) => `Expand ${count} replies `,
  totalReply: (count: number) => `Total ${count} replies`,
  totalObjects: (count: number) => `${count} items`,
  createFirstOne: (type: string) => `Publish your first ${type}~`,
  forumPost: 'Post',
  getNewObject: 'Receive new post',
  loading: 'Loading',
  noMore: (type: string) => `There are no more ${type} anymore`,
  emptySearchResult: 'No relevant content found ~',
  emptyImageSearchResult: 'No relevant pictures have been searched yet',
  expandContent: '...Expand the remaining content...',
  unExpandContent: '...Expanded too long content...',
  tipWithRum: 'Buy a cup for TA',
  imageSearchTip1: 'Try another keyword',
  imageSearchTip2: 'You can also try in English',
  pixabayLicenseTip: 'Pictures are powered by Pixabay, free to use',
  keyword: 'Keyword',
  latestForumPost: 'Latest Posts',
  createForumPost: 'Create a post',
  createFirstForumPost: 'Publish your first post',
  latest: 'Latest',
  hot: 'Hot',
  publishYourComment: 'Submit your comment...',
  htmlCode: 'Enter HTML',
  quotePlaceholder: "Enter the content you'd like to quote",
  clickToTune: 'Click to open menu',
  orDragToMove: 'Or press and drag',
  convertTo: 'Convert to',
  add: 'Add',
  text: 'Text',
  heading: 'Heading',
  list: 'List',
  quote: 'Quote',
  delimiter: 'dividing line',
  rawHTML: 'HTML',
  link: 'Link',
  marker: 'Highlight',
  table: 'Table',
  bold: 'Bold',
  italic: 'Italic',
  image: 'Picture',
  moveUp: 'Move up',
  moveDown: 'Move down',
  addALink: 'Add link',
  canDisplayedBlock: 'An error occurred, the content cannot be displayed normally',
  searchText: 'Please enter the keywords',
  confirmToFollow: 'Are you sure you want to view posts from this member? ',
  mutedList: 'Muted',
  cancelBlock: 'unmute',
  confirmToClearCacheData: 'Are you sure to clear cache data of this app? ',
  expand: 'Expand',
  shrink: 'Hide',
  selectFromImageLib: 'Select in the gallery',
  selectAvatar: 'Select Avatar',
  uploadImage: 'Upload image',
  selectProvider: 'Select operation method',
  moveOrDragImage: 'Move or zoom the picture',
  replace: 'Replace',
  upload: 'Upload',
  tokenAmount: 'Amount',
  reconnecting: 'The service has been disconnected, reconnecting',
  justNow: 'just now',
  minutesAgo: 'minutes ago',
  hoursAgo: 'hours ago',
  easymde: {
    bold: 'bold',
    italic: 'italic',
    heading: 'heading',
    quote: 'quote',
    ul: 'ul',
    ol: 'ol',
    image: 'image',
    link: 'link',
    preview: 'preview',
  },
  singleProducerConfirm: 'You are the only producer in this group. After you log out, the group will be permanently invalid and cannot be used normally. <br /><br />If you still want the group to continue to run normally after you exit, you can add another producer to take on the work of producing blocks.<br /><br />',
  singleProducerConfirmAll: 'You are the only producer in some group. After you log out, the group will be permanently invalid and cannot be used normally. <br /><br />If you still want the group to continue to run normally after you exit, you can add another producer to take on the work of producing blocks.<br /><br />',
  addProducerFeedback: 'I have passed your announcement, and you are welcome to be the producer of this group',
  removeProducerFeedback: 'I have removed you from the list of producers, and you are no longer a producer in this group',
  emptyAnnouncement: 'There are no announcements',
  submitAnnouncement: 'announce',
  clickToSubmitAnnouncement: 'announce',
  announcements: 'announcements',
  announcementReviewing: (owner: string) => `announced，wait for ${owner} reviewing`,
  wantToBeProducer: 'I want to be a producer',
  dontWantToBeProducer: "I don't want to continue making block nodes",
  announcementMemo: (memo: string) => `, reason：${memo}`,
  remove: 'remove',
  allow: 'allow',
  revoke: 'revoke',
  removed: 'Removed',
  allowed: 'Allowed',
  revoked: 'Revoked',
  confirmToAllowProducer: 'Allow to be a producer?',
  confirmToRemoveProducer: 'Remove from producers?',
  announceToExit: 'Announce to exit',
  announceToBeProducer: 'Announce to be producer',
  isProducer: 'You are currently a producer.',
  confirmToAnnounceExit: 'Are you sure to exit',
  reason: 'reason',
  producerNBlocks: (n: number) => `produced <span className="font-bold mx-[2px]">${n}</span> blocks`,
  producer: 'producer',
  createBlock: 'produce',
  canNotTipYourself: 'can not tip yourself',
  others: 'Other',
  accountAndSettings: 'Account and Settings',
  detail: 'detail',
  maxImageCount: (count: number) => `No more than ${count} pictures`,
  maxByteLength: 'The total size of the picture exceeds the limit, please try to compress the picture, or reduce the number of pictures',
  manageGroup: 'Edit SeedNet',
  manageGroupTitle: 'SeedNet Basic Info',
  manageGroupSkip: 'Skip, setup later',
  exitGroup: 'exit',
  exitGroupShort: 'exit',
  encryptedContent: 'Encrypted content',
  failedToReadBackipFile: 'Failed to read backup file',
  notAValidZipFile: 'Not a valid zip file',
  isNotEmpty: 'Folder is not empty',
  incorrectPassword: 'Incorrect password',
  writePermissionDenied: 'Have not write permission of the folder',
  allHaveReaded: 'All have readed',
  blocked: 'unmuted',
  block: 'mute',
  follow: 'follow',
  following: 'following',
  followLabel: 'follow',
  inputNickname: 'please input nickname',
  avatar: 'avatar',
  thumbUp: 'up',
  thumbDown: 'down',
  myGroup: 'My SeedNets',
  searchSeedNets: 'Search SeedNets',
  joinTime: 'Join Time',
  createTime: 'Create Time',
  selectAll: 'Select All',
  selectReverse: 'Reverse',
  announcement: 'announcement',
  openImage: 'open image',
  nodeRole: 'Node Role',
  ownerRole: 'Owner',
  noneRole: 'None Role',
  allRole: 'All Role',
  selected: 'Selected',
  option: '',
  cleanSelected: 'Clean Selected',
  profile: 'Profile',
  allProfile: 'All Profile',
  create: 'Create ',
  requireAvatar: 'Please select or upload avatar',
  item: '',
  changeProfile: 'Change Profile',
  bindOrUnbindWallet: 'Bind/Unbind Wallet',
  unbind: 'Unbind',
  sidebarIconStyleMode: 'icon',
  sidebarListStyleMode: 'list',
  updateAt: 'update at',
  default: 'default',
  initProfile: 'Init Profile',
  initProfileTitle: 'Joining:',
  selectProfile: 'Select Profile for New SeedNet',
  selectProfileFromDropdown: 'Select Profile from Dropdown',
  selectMixinUID: 'Select Wallet for New SeedNet',
  selectMixinUIDFromDropdown: 'Select Wallet from Dropdown',
  changeFontSize: 'Change Font Size',
  small: 'Small',
  normal: 'Normal',
  large: 'Large',
  youSelected: 'You Selected ',
  smallSizeFont: 'Small Size',
  normalSizeFont: 'Normal Size',
  largeSizeFont: 'Large Size',
  extraLargeSizeFont: 'Extra Large Size',
};
