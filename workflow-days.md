# პირველი დღე ~8 საათი

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

# მეორე დღე ~ 8 საათი

- დაემატა file გადაადგილება კოპირება (moveFile, copyFile) fs semantic დაცვით. წესები(parent existence, root guards, readOnly)
- განხორციელდა რეკურსიული დირექტორიის წაშლა deleteDirectory depth-first ლოგიკით
- დაემატა ბლობსთორ აბსტრაქცია და inmemory ბლობ სთორიჯის საწყისი იმპლემენტაცია
- სტრუქტურულად გამოიყო ბლობ ფოლდერი (ხვალ fsService გადავანაწილებ)
- ყველა ერორი იმაპება შესაფერის ჰტტპ სტატუსზე
- ყველაფერი გატესტილია ინსტომნია ე2ე
