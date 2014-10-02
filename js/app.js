angular.module('NotesApp', [
    'ngStorage'
  ])
  .directive('syncFocusWith', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            focusValue: "=syncFocusWith"
        },
        link: function($scope, $element, attrs) {
            $scope.$watch("focusValue", function(currentValue, previousValue) {
                if (currentValue === true && !previousValue) {
                  console.log("Focusing " + $element[0].id);
                  $timeout(function() {
                    $element[0].focus(); 
                  });
                } else if (currentValue === false && previousValue) {
                  $element[0].blur();
                }
            })
        }
    }
  })
  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
  })
  .factory('NotesService', ['$localStorage', function($localStorage){
    var self = this;
    self.notes = $localStorage.notes || [];

    var maxId = 0;

    angular.forEach(self.notes, function(note, key){
      if ( note.id > maxId ) {
        maxId = note.id;
      }
    });

    self.nextId = maxId + 1;

    return {
      updateStorage: function() {
        $localStorage.notes = self.notes;
      }, 

      list: function(filter) {

        if ( filter == 'all' ) {
          return self.notes;
        } else if ( filter == 'completed' ) {
          return self.notes.filter(function(note) { return note.complete; });
        } 

        return self.notes.filter(function(note) { return !note.complete; });
      },

      addNote: function(note) {
        note.id = self.nextId++;
        self.notes.push(note);
        this.updateStorage();
      },

      clearCompleted: function() {
        self.notes = self.notes.filter(function(note) { return !note.complete; });
        this.updateStorage();
      },

      updateAll: function(allComplete) {
        angular.forEach(self.notes, function(note, index) {
          note.complete = allComplete;
        });
      },

      deleteNote: function(note) {
        self.notes.splice(self.notes.indexOf(note), 1);
        this.updateStorage();
      },

      countState: function(state) {
        var count = 0;

        angular.forEach(self.notes, function(note, index) {
          if ( note.complete == state ) {
            count ++;
          }
        });

        return count;
      }
    }
  }])
  .controller('NotesCtrl', ['NotesService', function(NotesService){
    var self = this;
    self.filter = 'all';
    self.allComplete = false;
    self.editing = {};
    self.noteFocus = null;

    this.addNote = function() {
      self.note.complete = false;
      NotesService.addNote(angular.copy(self.note));
      self.note.title = '';
    };

    this.noteClass = function(note) {
      return {'completed': note.complete, 'editing': self.editing[note.id]};
    };

    this.clearCompleted = function() {
      NotesService.clearCompleted();
    };

    this.notes = function() {
      return NotesService.list(self.filter);
    };

    this.updateAll = function() {
      NotesService.updateAll(self.allComplete);
    };

    this.updateFilter = function(filter) {
      self.filter = filter;
    };

    this.deleteNote = function(note) {
      NotesService.deleteNote(note);
    };

    this.remaining = function() {
      return NotesService.countState(false);
    };

    this.completed = function() {
      return NotesService.countState(true);
    };

    this.edit = function(note) {
      self.editing[note.id] = true;
      self.noteFocus = note;
    };

    this.completeEditing = function(note) {
      self.editing[note.id] = false;

      if ( self.noteFocus == note ) {
        self.noteFocus = null;
      }
    };
  }]);