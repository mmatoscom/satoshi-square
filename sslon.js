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
      var myNym = Nymlist.findOne({}, {reactive: false});
      if (myNym){
        Session.set("nymuser", myNym.nyms[myNym.taken]);
        Nymlist.update({_id: myNym._id}, {$inc: {taken: 1}});
        setCookie("sslon", myNym.nyms[myNym.taken],5);
      } else {
        Session.set("nymuser", "Anonymous");
      }
    }
  });

  Template.codename.getCurrentUser = function () {
      return Session.get("nymuser");
  }
  Template.matches.dismissBtn = function (order) {
      return Session.get("nymuser");
  }

  Template.orders.buyMode = function () {
    return Session.equals("buyModeActive", true);
  };

  Template.orders.getSubTotal = function () {
    var tempSubTotal = Session.get("subTotal");
    if(typeof tempSubTotal === "undefined")
      tempSubTotal = 0;
    return tempSubTotal.toFixed(2);
  };

  Template.book.toDec = function (badNum) {
    return badNum.toFixed(2);
  };

  Template.book.getBids = function () {
    return Orders.find({type: "bid", matched: false }, {
      sort: {price: -1, timestamp: 1}
    });
  };

  Template.book.getAsks = function () {
    return Orders.find({type: "ask", matched: false }, {
      sort: {price: 1, timestamp: 1}
    });
  };

  Template.book.isMine = function () {
    return this.owner == Session.get("nymuser") ;
  };

  Template.book.events({
    'click .delete-button' : function (evt, templ) {
      Orders.remove(this._id);
    }
  });

  //Template.orders.preserve(['.buy-toggle','.sell-toggle']);

  Template.orders.events({
    'click #orderSubmit' : function (evt, templ) {
      // template data, if any, is available in 'this'
      if (templ.find("#buyButton.active")) {
        var myType = "bid";
      } else {
        var myType = "ask";
      }
      var mySize = parseInt(templ.find("#orderSize").value);
      var myPrice = parseFloat(templ.find("#orderPrice").value);
      if (mySize < 0 || myPrice < 0)
        return;
      if (myType == "bid") {
        var opposing = Orders.find({
          type: "ask",
          matched: false,
          price: {$lte: myPrice }
        }, {
          sort: {price: 1, timestamp: 1}
        });
      }
      if (myType == "ask") {
        var opposing = Orders.find({
          type: "bid",
          matched: false,
          price: { $gte: myPrice }
        }, {
          sort: {price: -1, timestamp: 1}
        });
      }
      opposing.forEach(function (oppOrder) {
        if (oppOrder.size > mySize) {
          Orders.update({_id: oppOrder._id}, { $inc: {size: mySize * -1}});
          Orders.insert({
            type: myType,
            size: mySize,
            price: oppOrder.price,
            matched: true,
            owner: oppOrder.owner,
            opponent: Session.get("nymuser")
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
        if (oppOrder.size == mySize) {
          Orders.update({_id: oppOrder._id},
            { $set: { matched: true,
                      opponent: Session.get("nymuser")
                    }
            });
          mySize = 0;
          return;
        }
      });
      if (mySize>0) {
        Orders.insert({
          type: myType,
          size: mySize,
          price: myPrice,
          matched: false,
          owner: Session.get("nymuser"),
          timestamp: new Date()
        });
      }
    },
    'keyup .input-reactive' : function (evt, templ) {
      var tempPrice = parseFloat(templ.find('#orderPrice').value);
      var tempSize = parseInt(templ.find('#orderSize').value);
      var tempSubTotal = tempPrice * tempSize/1000;
      Session.set("subTotal" , tempSubTotal);
    }
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

  Template.matches.getMyMatches = function () {
    return Orders.find( { matched: true, owner: Session.get("nymuser")
    });
  }
  Template.matches.getMatches = function () {
    return Orders.find( { matched: true, opponent: Session.get("nymuser"),
     owner: { $ne: Session.get("nymuser")}});
  }
  Template.matches.subTotal = function (order) {
    var subT = order.price * order.size/1000;
    return subT.toFixed(2);
  }
  Template.matches.events({
    'click .dismiss-button' : function (evt, templ) {
      Orders.remove(this._id);
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Nymlist.insert({ nyms: 
["Falcon","Dragonfly","Cobra","Seahorse","Bobcat","Kingfisher","Jackal","Nightingale","Grasshopper","Viper","Cougar","Meadowlark","Salamander","Roadrunner","Lynx","Firefly","Hummingbird","Wolverine","Wolf","Mongoose","Raven","Dolphin","Rattlesnake","Condor","Damselfly","Tyrannosaurus","Flamingo","Octopus","Angelfish","Eagle","Shark","Jaguar","Butterfly","Tarantula","Cheetah","Husky","Panther","Anaconda","Silverfish","Swordfish","Gazelle","Albatross","Wildebeest","Scorpion","Barracuda","Woodpecker","Silkworm","Horse","Ape","Trout","Sheep","Marlin","Moth","Bandicoot","Wildcat","Turtle","Yak","Monkey","Dingo","Leech","Grouse","Penguin","Owl","Sturgeon","Parrot","Puma","Warbler","Wombat","Swift","Ostrich","Crane","Skunk","Squid","Scallop","Ferret","Vulture","Deer","Minnow","Caterpillar","Llama","Jellyfish","Armadillo","Chimpanzee","Chihuahua","Goldfish","Swan","Buzzard","Mite","Carp","Mosquito","Snake","Rooster","Whale","Pigeon","Walrus","Mussel","Chameleon","Mink","Alpaca","Skink","Shrimp","Primate","Mockingbird","Shrew","Parrotfish","Cat","Fish","Possum","Stingray","Toad","Terrier","Ant","Termite","Otter","Dog","Snail","Cod","Centipede","Python","Gerbil","Hornet","Starfish","Wren","Lemming","Ox","Ocelot","Liger","Swallow","Puffin","Fowl","Prawn","Porpoise","Haddock","Rat","Hound","Koala","Spoonbill","Spider","Badger","Tuna","Camel","Clownfish","Flyingfish","Dinosaur","Antelope","Greyhound","Macaw","Coral","Beaver","Salmon","Stork","Marmot","Orca","Tapir","Pelican","Duck","Pheasant","Halibut","Kangaroo","Moose","Vole","Gopher","Tick","Rook","Hoverfly","Mackerel","Wallaby","Poodle","Hawk","Hedgehog","Lamprey","Buffalo","Partridge","Chinchilla","Tiger","Oyster","Mammoth","Elephant","Orangutan","Heron","Mule","Guineafowl","Rhinoceros","Zebra","Tortoise","Kite","Stoat","Reindeer","Narwhal","Donkey","Crow","Fox","Fly","Bison","Ladybird","Crayfish","Hippopotamus","Setter","Mouse","Newt","Pony","Catfish","Crocodile","Elk","Chicken","Cow","Finch","Eel","Gecko","Hyena","Marmoset","Hare","Piranha","Toucan","Rabbit","Goose","Raccoon","Chipmunk","Gibbon","Sparrow","Gorilla","Platypus","Lark","Anteater","Krill","Clam","Turkey","Guppy","Panda","Earthworm","Dove","Bear","Beetle","Harrier","Weasel","Herring","Iguana","Sloth","Magpie","Lizard","Cuckoo","Caribou","Sole","Wasp","Lion","Cattle","Giraffe","Earwig","Bonobo","Quail","Leopard","Mole","Baboon","Frog","Crab","Bat","Alligator","Porcupine","Emu","Mastodon","Muskox","Locust","Bulldog","Sailfish","Coyote","Whitefish","Peacock","Lemur","Meerkat","Bee","Goat","Parakeet","Cricket","Hamster","Squirrel","Peafowl","Tern","Aardvark","Flea","Lobster","Bug"],
    taken: 0
    })
  });
}
