Orders = new Meteor.Collection('Orders');
Nymlist = new Meteor.Collection("Nymlist");

function readCookie(cookieName) {
   var re = new RegExp('[; ]'+cookieName+'=([^\\s;]*)');
    var sMatch = (' '+document.cookie).match(re);
     if (cookieName && sMatch) return unescape(sMatch[1]);
      return '';
};
function setCookie(cookieName,cookieValue,nDays) {
 var today = new Date();
 var expire = new Date();
 if (nDays==null || nDays==0) nDays=1;
 expire.setTime(today.getTime() + 3600000*24*nDays);
 document.cookie = cookieName+"="+escape(cookieValue)
                 + ";expires="+expire.toGMTString();
};

if (Meteor.isClient) {
  Meteor.startup(function () {
    Session.set("buyModeActive", true);
    if (document.cookie.length > 0) {
      Session.set("nymuser", readCookie("sslon"));
    } else {
      var myNym = Nymlist.findOne({});
      Session.set("nymuser", myNym.nyms[myNym.taken]);
      Nymlist.update({_id: myNym._id}, {$inc: {taken: 1}});
      setCookie("sslon", myNym.nyms[myNym.taken],5);
    }
  });

  Template.codename.getCurrentUser = function () {
      return Session.get("nymuser");
  }

  Template.orders.buyMode = function () {
    return Session.equals("buyModeActive", true);
  };

  Template.orders.getBids = function () {
    return Orders.find({type: "bid", matched: false }, {
      sort: {price: 1, timestamp: 1}
    });
  };

  Template.orders.getAsks = function () {
    return Orders.find({type: "ask", matched: false }, {
      sort: {price: -1, timestamp: 1}
    });
  };

  //Template.orders.preserve(['.buy-toggle','.sell-toggle']);

  Template.orders.events({
    'click #orderSubmit' : function (evt, templ) {
      // template data, if any, is available in 'this'
      if (templ.find("#buyButton.active")) {
        console.log("submit found");
        var myType = "bid";
      } else {
        var myType = "ask";
      }
      var mySize = parseFloat(templ.find("#orderSize").value);
      var myPrice = parseFloat(templ.find("#orderPrice").value);
      if (myType == "bid") {
        var opposing = Orders.find({
          type: "ask",
          matched: false,
          price: {$lt: myPrice }
        }, {
          sort: {price: 1, timestamp: 1}
        });
      }
      if (myType == "ask") {
        var opposing = Orders.find({
          type: "bid",
          matched: false,
          price: { $gt: myPrice }
        }, {
          sort: {price: -1, timestamp: 1}
        });
      }
      opposing.forEach(function (oppOrder) {
        if (oppOrder.size >= mySize) {
          Orders.update({_id: oppOrder._id}, { $inc: {size: mySize * -1}});
          Orders.insert({
            type: myType,
            size: mySize,
            price: oppOrder.price,
            matched: true,
            owner: Session.get("nymuser"),
            opponent: oppOrder.owner,
          });
          mySize = 0;
          return;
        }
        if (oppOrder.size < mySize) {
          Orders.update({_id: oppOrder._id}, { $set: {
            matched: true,
            opponent: Session.get("nymuser")
          }});
          mySize -= oppOrder.size;
        }
      });
      if (mySize>0)
        Orders.insert({
          type: myType,
          size: mySize,
          price: myPrice,
          matched: false,
          owner: Session.get("nymuser"),
          timestamp: new Date()
        });
    }//,
    // 'click .btn' : function (evt, templ) {
    //   var clickedButton = evt.currentTarget;
    //   var buttonId = $(clickedButton).attr("id");
    //   if (buttonId == "buyButton") {
    //     Session.set("buyModeActive", true);
    //     //$(clickedButton).toggleClass("btn-success", true);
    //     //$('#sellButton').toggleClass("btn-danger", false);
    //   }
    //   if (buttonId == "sellButton") {
    //     Session.set("buyModeActive", false);
    //     //$(clickedButton).toggleClass("btn-danger", true);
    //     //$('#buyButton').toggleClass("btn-success", false);
    //   }
    // }
  });

  Template.matches.getMatches = function () {
    return Orders.find( { matched: true, $or: [{user: Session.get("nymuser")},
      {opponent: Session.get("nymuser")}]
    });
  }

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Nymlist.insert({ nyms: 
      ["Horse","Ape","Grouse","Falcon","Trout","Sheep","Marlin","Moth","Bandicoot","Wildcat","Dragonfly","Turtle","Cobra","Yak","Monkey","Dingo","Leech","Penguin","Owl","Sturgeon","Seahorse","Parrot","Puma","Warbler","Wombat","Swift","Ostrich","Crane","Skunk","Squid","Scallop","Ferret","Vulture","Deer","Damselfly","Minnow","Caterpillar","Panther","Llama","Jellyfish","Armadillo","Kingfisher","Chimpanzee","Chihuahua","Goldfish","Swan","Wolf","Buzzard","Mite","Carp","Mosquito","Dolphin","Rattlesnake","Snake","Rooster","Whale","Pigeon","Walrus","Mussel","Chameleon","Condor","Mink","Alpaca","Skink","Shrimp","Primate","Mockingbird","Shrew","Parrotfish","Cat","Fish","Possum","Stingray","Toad","Terrier","Ant","Termite","Tyrannosaurus","Otter","Dog","Snail","Cod","Flamingo","Centipede","Python","Octopus","Angelfish","Viper","Wolverine","Gerbil","Hornet","Starfish","Wren","Lemming","Ox","Ocelot","Eagle","Liger","Swallow","Puffin","Fowl","Prawn","Shark","Jaguar","Porpoise","Haddock","Rat","Human","Hound","Koala","Spoonbill","Spider","Badger","Tuna","Camel","Clownfish","Flyingfish","Dinosaur","Antelope","Greyhound","Macaw","Coral","Beaver","Salmon","Jackal","Stork","Meadowlark","Koi","Marmot","Bug","Salamander","Orca","Roadrunner","Tapir","Tarantula","Grasshopper","Nightingale","Pelican","Duck","Cheetah","Pheasant","Halibut","Husky","Kangaroo","Moose","Vole","Raven","Gopher","Tick","Rook","Hoverfly","Mackerel","Wallaby","Anaconda","Silverfish","Poodle","Hawk","Hedgehog","Lamprey","Buffalo","Swordfish","Partridge","Chinchilla","Tiger","Oyster","Mammoth","Elephant","Orangutan","Heron","Mule","Guineafowl","Rhinoceros","Gazelle","Zebra","Mongoose","Tortoise","Cougar","Lynx","Kite","Stoat","Firefly","Reindeer","Narwhal","Donkey","Crow","Fox","Fly","Bison","Hummingbird","Ladybird","Crayfish","Hippopotamus","Setter","Mouse","Newt","Pony","Catfish","Crocodile","Elk","Chicken","Cow","Finch","Eel","Gecko","Hyena","Marmoset","Hare","Piranha","Toucan","Rabbit","Goose","Raccoon","Chipmunk","Gibbon","Sparrow","Gorilla","Platypus","Albatross","Lark","Anteater","Krill","Opossum","Clam","Turkey","Guppy","Panda","Wildebeest","Scorpion","Earthworm","Silkworm","Dove","Bear","Barracuda","Beetle","Harrier","Weasel","Herring","Iguana","Sloth","Bobcat","Magpie","Lizard","Butterfly","Cuckoo","Caribou","Sole","Wasp","Lion","Cattle","Giraffe","Earwig","Bonobo","Quail","Leopard","Mole","Baboon","Frog","Crab","Bat","Alligator","Porcupine","Emu","Woodpecker","Mastodon","Muskox","Locust","Bulldog","Sailfish","Coyote","Whitefish","Peacock","Lemur","Meerkat","Bee","Goat","Parakeet","Cricket","Hamster","Squirrel","Peafowl","Tern","Aardvark","Flea","Lobster"],
    taken: 0
    })
  });
}
