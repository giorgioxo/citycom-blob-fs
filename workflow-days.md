# პირველი სამუშაო დღე ~8 საათის ინტერვალი

** შეიქმნა backend პროექტი node.js, typescript და express სტეკზე **

- დაემატა parent directory ვალიდაცია (არსებობა+ტიპი)
- root "/" დამუშავდა როგორც სპეციალური filesystem node
  დროებით inmemory bootstrap-ზეა, db- გადასვლისას წავშლი
- გაკეთდა რეკურსიული directory listing /a/ პრეფიქსის ლოგიკით
- დაემატა file entity (metadata only, ბლობი ხვალ დაემატება)
- დაემატა readOnly permission (write ოპერაციები იბლოკება)
- განისაზღვრა file vs directory ძირითადიინვარიანტები
- business errors გადაიმაპა შესაფერის http სტატუსებზე
- სისტემა იტესტება ინსომნიით e2e
