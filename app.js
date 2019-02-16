/* BUDGET CONTROLLER */
var budgetController = (function() {
    // constructors for creating objects out of the input data
    var Expense = function(id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
      // stores the percentage calculated in the calcPercentage function. Set to -1 so that nothing occurs until we have a value to insert here.
      this.percentage = -1;
    };

    // Creating a method to calculate percentage of budget for each expense item inside the protoype of the expense constructor. This way, each expense that is created will automatically carry this property.
    Expense.prototype.calcPercentage = function(totalIncome) {
      if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
    };


    // Adding another method to the constructor that simply returns the percentage that we add into the object.
    Expense.prototype.getPercentage = function() {
      return this.percentage;
    };

    var Income = function(id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
    };

    // This is a private function that adds either the inc or exp array items together.
    var calculateTotal = function(type) {
        var sum = 0;
        // This function takes each item of the specified array, where [type] determines which array we are working on, and then uses the forEach method loop over and add all the items together, to give us the sum of incomes or expenses.
        data.allItems[type].forEach(function(cur) {
          sum += cur.value;
        });
        // This adds the sums to the globally available 'data' object. Note that the type here comes from the 'type' passed in as an argument in the beginning of the calculateTotal function when we call it from teh calculateBudget function.
        data.totals[type] = sum;
    }


    // objects with nested arrays for storing all the objects we create with the above constructors
    var data = {
      allItems: {
        exp: [],
        inc: [],
      },
      totals: {
        exp: 0,
        inc: 0
      },
      budget: 0,
      percentage: -1
    };

    return {
      addItem: function(type, des, val) {

        var newItem, ID;
        // this ID gives any input that we enter a unique ID that it will hold regardless of other entries. The ID we give is always equal to the ID of the last item in the array plus one, so we will never have duplicate IDs.
        if(data.allItems[type].length > 0) {
            ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
        } else {
          ID = 0;
        }


        // create new item with ID from above.
        if (type === 'exp') {
          newItem = new Expense(ID, des, val);
      } else if (type === 'inc') {
          newItem = new Income(ID, des, val);
      }

      // pushes any new inputs into the correct array (either inc or exp), and then returns that new item to the object that called it.
      data.allItems[type].push(newItem);
      return newItem;

      },

      // method for deleting any items out of our exp or inc arrays. We pass in the two pieces of data we need to target an element for deletion, the type (array it's located in) and the id (id is created when item is added to the array by the user in the UI controller). We will pass these in when we call the function in the global controller app.
      deleteItem: function(type, id) {
        var ids, index;

      // ids will become an array that is a snapshot of the current array order in either the inc or exp category. The .map method creates a new array by calling the return function on each of the elements in our array, yielding a new array with each element listed by ID and indexed from 0 - the length of the array.
        ids = data.allItems[type].map(function(current) {
        return current.id;
      });

      // loading the variable index with the current index of the ID we've targeted.
      index = ids.indexOf(id);

      // if there is an item to index, then we use the splice method to delete the targeted item. Splice takes in our array and two arguments: the index at which we want to begin the number of items we want to delete afterward. In this case, just one.
      if (index !== -1) {
        data.allItems[type].splice(index, 1);
      }
    },

    calculateBudget: function () {

      // 1. Calculate total income and expenses
      calculateTotal('exp');
      calculateTotal('inc');
      // 2. Calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;
      // 3. Calculate the %age of income that we've spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }

    },

    calculatePercentages: function() {

      // Since we are only concerned with calculating the %age of the expenses, we call on the exp array located in the data structure. We then use foreach to loop over each element of the exp array, calculating the percentage for each instance of the loop.
      // Note that calcPercentage is a function that takes in the totalIncome value that we need in order to perform the %age calculation, so we need to pass that value in here when we call the function. Otherwise, the totalIncome will remain 0, thus returning -1 when we attempt to use the app as intented.
      data.allItems.exp.forEach(function(cur) {
        cur.calcPercentage(data.totals.inc);
      });

    },


    // Here we create the variable allPerc, load it with the array generated by the .map function, which runs getPercentage (which performs the exp/totalIncome equation) on each of the elements in the exp array. We then return allPerc, which is an array holding all the current percentages of the budget for each item in the expense array.
    getPercentages: function() {
      var allPerc = data.allItems.exp.map(function(cur){
        return cur.getPercentage();
      });
      return allPerc;
    },

    // This method serves just one purpose: to return the values of the budget so that we can store them in a variable that we can in turn display on the page.
    getBudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage

      }
    },

    testing: function() {
      console.log(data);
    }

  };


})();



/* UI CONTROLLER */
var UIController = (function() {

    // replace the many strings we have from our queryselectors by adding them into an object and making the object properties correspond to the strings we want to replace. This prevents us from having to change our code in all places if we want to change any of the strings.
    var DOMStrings = {
      inputType: '.add__type',
      inputDescription: '.add__description',
      inputValue: '.add__value',
      inputBtn: '.add__btn',
      incomeContainer: '.income__list',
      expensesContainer: '.expenses__list',
      budgetLabel: '.budget__value',
      incomeLabel: '.budget__income--value',
      expensesLabel: '.budget__expenses--value',
      percentageLabel: '.budget__expenses--percentage',
      container: '.container',
      expensesPercLabel: '.item__percentage',
      dateLabel: '.budget__title--month'


    };

    // removed this formatNumber function from the publicly available method status to a private function that is executed inside of the UIController IIFE.
    var formatNumber = function(num, type) {
      var numSplit, int, dec, type;
      // First we use Math.abs (method of the Math object) to remove the +/- value from the number, then we use toFixed (property of the number prototype), which fixes the two decimal positions to the the number displayed. This will automatically round any numbers with more than two decimal positions to the nearest hundredth, and also add two zeroes to any number without decimal places. Keep in mind that each time that we give num a new value, it overwrites the previous one, starting with the value we enter as one of the arguments.
      num = Math.abs(num);
      num = num.toFixed(2);
      // Because the number produced by num.toFixed is actually a string, we can use the .split method to split the number into its whole number and decimal parts, which will then exist in an array generated by numSplit. We will then call each member of the array generated by numSplit int (for the integer portion) and dec (for the decimal portion).
      numSplit = num.split('.')

      int = numSplit[0];

      if (int.length > 3) {
        //.substr allows us to further break down int into two portions. The method takes in two arguments, the position we start from, and the number of digits we want to cut off at. Here we take int, breakk it into substring one that starts at index 0, counts over how many digits are in the string and then subtracts 3, giving us the correct position for the comma (which we add directly after) in any number over 3 digits. We then add after the comma the rest of the int string, counting from where we left off in the first one (int.length - 3), which should be 3 digits if the comma is placed correctly.
        int = int.substr(0, int.length -3) + ',' + int.substr(int.length - 3, 3);
      }

      dec = numSplit[1];


      return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;

    };

    // Moved outside the displayPercentages method so that nodeListForEach is accessible to both that method as well as changedType.
    var nodeListForEach = function(list, callback) {
      for (var i = 0; i < list.length; i++) {
        callback(list[i], i);
      }
    }

    // this object will be returned whenever the UIController is called. Making the data that would otherwise be private to this module accessible from others.

    return {
      getInput: function() {

         return {
          type: document.querySelector(DOMStrings.inputType).value, // inc or exp
          description: document.querySelector(DOMStrings.inputDescription).value,
          value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
        };
      },

      addListItem: function(obj, type) {
        var html, newHtml, element;
        // Create HTML with placeholder text
        if (type === 'inc') {
            element = DOMStrings.incomeContainer;

            html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
        } else if (type === 'exp') {
            element = DOMStrings.expensesContainer;

            html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
        }

        // - Replace placeholder text with actual data -
        // Replace here replaces the first argument with the second. So, we take in the HTML block from above, replace the %id%, with obj.id, then we take that new altered block inside the variable newHTML, and then replace description with obj.description, then, since at this point in the process the compiler sees new html as having both id and description replaced with their resepctive obj properties, we can take in newHTML once again and replace the value with obj.value. We then use insertAdjacentHTML to insert this new code 'beforeend' of the element we've passed in (which is determined above via the if statement, and will be either the income__list, or expenses__list container). The result is that the page will then show the inserted HTML code with the id, description, and value that the user inputs in whichever of the lists (income or expense) the user selected when inputing the item information.
        newHtml = html.replace('%id%', obj.id);
        newHtml = newHtml.replace('%description%', obj.description);
        // Here we've added the formatNumber function to the replace method for the value field. We still take in the obj.value, but we run it through our formatNumber function first before we send it to the UI. This way the number will have all the visual characteristics we want it to when displayed on the page.
        newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

        // Insert HTML into the DOM
        document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
      },

      deleteListItem: function(selectorID) {

        // We want to delete the entire HTML code for the list item the user clicks, so we target that block of code by entering the containing variable as an argument, which will be the itemID from the Global Controller. ItemID gives us the #id of the block of code that comprises the list item in the HTML mark up, so when we pass that into the getElementById('id') it points to the container holding that block. We then point backward to its parentNode, and then tell the parent node to delete the child element that contains that id (which is again pointed at by getElementById('id')) by using the removeChild method. This is awkward,because there isn't a method to simply delete an item in the DOM by directly targeting it, and instead have to target the parent and then tell it to removeChild - but it is at least a functional way of removing an element from the HTML mark up via our JS file.
        var el = document.getElementById(selectorID);

        el.parentNode.removeChild(el);
      },


      // clear fields of any data typed in
      clearFields: function() {
        var fields, fieldsArr;
        // querySelectorAll uses a syntax similar to css, which separates its elements by use of a comma. We therefore add a ',' as a string between our selectors
        fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);

        // querySelectorAll returns a 'list' rather than an array, so we need to transform it into an array via the slice method. To do this, we call on the slice method that is part of the array prototype, and then use the call method, passing in the list 'fields' as an argument for that function. This tricks the compiler into seeing the list we entered as an array, and so we can then use all our array methods to allow the rest of our code to interact with it.
        fieldsArr = Array.prototype.slice.call(fields);

        // for each method: we pass in a callback function as an argument, and then the forEach method will apply this function to each element of the array we called. The callback we pass in can accept UP TO THREE ARGUMENTS.

        // as for these three arguments, we are passing in 'current' (which will be the value that the function is currently applied to to), 'index' (the index value of the current item the function is applied to) , and 'array' (simply the entire array). In this case 'current' stands for both of the values we need to overwrite, so we need only change their value to ' '. The other arguments are passed in so that the function will be able to act on each of the array items.
        fieldsArr.forEach(function(current, index, array) {
          current.value = "";
        });
        // shifts focus back to the 'current' element, which is in our case the description field, since each element of the fields array starts with DOMStrings.inputDescription.
        fieldsArr[0].focus();

      },

      displayBudget: function(obj) {
        var type;
        // This ternary operator determines whether the type will be inc or exp, based on the value of the obj.budget. If it is over 0, then the budget will be positive, if it is below then we want the symbol for exp, which is -. It's important to note that the budget is not an item that will be associated with either the inc or exp arrays, but rather that we enter the type so the the formatNumber function will assign the correct symbol to the UI display of the budget. For the totalInc and totalExp we assign directly the type 'inc' or 'exp' respectively.
        obj.budget > 0 ? type = 'inc' : type = 'exp';

        document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
        document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
        document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');


        if (obj.percentage > 0) {
          document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
        } else {
          document.querySelector(DOMStrings.percentageLabel).textContent = '---';
        }
      },

      // Method for displaying the %ages of each expense item in the UI.
      displayPercentages: function(percentages) {
        // We use querySelectorAll to target all HTML nodes with the class 'item__percentage', which we assigned to our DOMStrings as expensesPercLabel (each expense in the array will have this HTML node). We then need to change the textContent property for each of these nodes according to our percentages array. The variable fields is essentially an array that contains pointers to each of the HTML nodes that have the class 'item__percentage', which means that we can alter these nodes using textContent.
        var fields = document.querySelectorAll(DOMStrings.expensesPercLabel);

        // In this function we have two parameters - the list (an array) and a callback function. In the function we use a for loop to iterate over the list we pass in, and then we apply the function to each of the list items. The callback as written here takes in two arguments, which are the current element in the array, and then the index of that current element


        // Below we call the nodeListForEach function, and pass in fields as the 'list' agrument, which is the array we need to loop over - then we write in the function that we want to use as a callback. As we stipulated in the nodeListForEach function, the function call below will take in two parameters, which are the current item in the array, and then the index of that item in the specified array. Then for the current item (current item in the for loop from the nodeListForEach function), we will target the textContent, and change it to equal the value of whichever item (index) of the percentages array we have as the current argument (this comes from the allPerc array, which is the calcPercentage equation that we wrote into the prototype of the expense constructor run on each of the members of the exp array), plus the % sign, so that our UI makes sense to the user. However, we only do this if the current index has a value greater than 0, otherwise we display '---' to indicate that there is no %age value.
        nodeListForEach(fields, function(current, index) {
          if (percentages[index] > 0) {
            current.textContent = percentages[index] + '%';
          } else {
            current.textContent = '---';
          }
        });
      },

      displayMonth: function() {
        var month, months, year, now;

        // Using the object constructor format to access the 'Date' object. This will give us access to the methods from the date prototype.
        now = new Date();

        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // .getMonth and .getFullYear are methods of the 'Date' prototype.
        month = now.getMonth();

        year = now.getFullYear();

        // Using the .getMonth generates a number corresponding to the current month. We access that number and make it the index of the array 'months' we created, so that the date displays as a word rather than an integer.
        document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;


      },



      changedType: function() {

        //In the below code we create a variable that contains all the HTML shrotcuts that correspond to the buttons we want to change the color of. We then run the nodeListForEach function with classList.toggle and the class 'red-focus' that we want to toggle on and off when our trigger event occurs ('type' changes from - to +). We then apply the class 'red' to the input button, as it is not an item that gets focus, and we simply want it to change colors any time the income type is changed.
        var fields = document.querySelectorAll(
          DOMStrings.inputType + ',' +
          DOMStrings.inputDescription + ',' +
          DOMStrings.inputValue);

        nodeListForEach(fields, function(cur) {
          cur.classList.toggle('red-focus');
        });

        document.querySelector(DOMStrings.inputBtn).classList.toggle('red');

      },

      getDOMStrings: function() {
        return DOMStrings;
      }
    };

})();



/* GLOBAL APP CONTROLLER */
var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {

      // variable to allow this module access to the DOMStrings object from the UIController. Further eliminating our need for strings in any of our code.
      var DOM = UICtrl.getDOMStrings();

      // Here ctrlAddItem does not need to be invoked using the () function call. Inside an event listener, it is automatically called by the trigger event itself.
      document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

      document.addEventListener('keypress', function(event) {
        if (event.keycode === 13 || event.which === 13) {
          ctrlAddItem(); // keycode 13 corresponds to the enter key
        }
    });

    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

  };


    // We've moved steps 5 and 6 to an independent function, becasue when we add the delete functions we'll need to call on these tasks again. To eliminate duplicate code we write them into a separate function that we can call from either place.
    var updateBudget = function() {
      // 6. Calculate the budget
      budgetCtrl.calculateBudget();

      // 7. Return the budget
      var budget = budgetCtrl.getBudget();

      // 8. Display the budget on the UI
      UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {
      // 1. Calculate percentages
      budgetCtrl.calculatePercentages();
      // 2. Read perecentages from budget contoller
      var percentages = budgetCtrl.getPercentages();
      // 3. Update the UI with the new percentages
      UICtrl.displayPercentages(percentages);
    }

    // callback function to make the click and enter functions workable from anywhere inside the module.
    var ctrlAddItem = function() {
      var input, newItem;

      // 1. Get the field input Data from the UIController (user input)
      input = UICtrl.getInput();

    // check to make sure that the entry for desc is not empty, and make sure that the value entry is a non zero integer, before adding any items to either array.
    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {

      // 2. Add the item to the budget CONTROLLER
      var newItem = budgetCtrl.addItem(input.type, input.description, input.value)

      // 3. Add the item to the UI
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear fields
      UICtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update perecentages
      updatePercentages();
    }

    };

    var ctrlDeleteItem = function(event) {
      var itemID, splitID, type, ID;

      // target tells us where the event (click) occurs - we then use the parentNode method and the specific id of the container housing both income and expense to tell the program where to stop deleting the html when the eventListener is triggered.
      itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

      // we coerce itemID into a boolean, and if it is true (only true when the user clicks the specified icon) we then execute the function.
      if (itemID) {
        // .split is a js method that applies to strings. It takes in a parameter, such as '-', which it uses as a marker to split the string into individual strings wherever '-' occurrs. We then use these individual pieces of the string (derived from the html of the container that we are deleting) to form the variables type and ID, which are either inc or exp, and an identifying number corresponding to its position in whichever array we are working in.
        splitID = itemID.split('-');
        type = splitID[0];

        // we need to turn this string into a number value because we will otherwise when we run indexOf we will be searching the array for a string rather than a number (our unique IDs are number values given by actually adding 1 to the value of the last ID in the array). We therefore use parseInt to give indexOf an appropriate id to search for.
        ID = parseInt(splitID[1]);

        // 1. Delete item from the data structure
        budgetCtrl.deleteItem(type, ID);
        // 2. Delete item form the UI
        UICtrl.deleteListItem(itemID);
        // 3. Update and show new Budget
        // updateBudget calls a number of functions: calculateBudget, getBudget, and displayBudget. We need all of these to be called whenever we delete an item in order for the UI to reflect what we changed when we delete an item inside this ctrlDeleteItem function. updateBudget needs to be called both when we add or delete an item, and this is why we created it as an independent function that we could call from multiple locations.
        updateBudget();
      }

    };

    return {
      // created to have a single place in which we store all the items that we want to execute upon the loading of the page.
      init: function() {
        console.log('Application started');
        UICtrl.displayMonth();
        UICtrl.displayBudget({
          budget: 0,
          totalInc: 0,
          totalExp: 0,
          percentage: -1
        })
        setupEventListeners();
      }
    }



})(budgetController, UIController);

// only code that is NOT inside a module
controller.init();
