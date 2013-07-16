define(['jquery', 'socket', 'util/determine-css-class', 'board', 
         'util/notification', 'board/infinite-drag', 'user', 
         'viewport', 'util/grid-size', 'throttle', 'zoom-js'], 
    function($, socket, determineCssClass, board, notification, 
        infiniteDrag, user, viewport, gridCalc, throttle) {
    
    Card.prototype.bringToFront = function(event, element) {

        if (element.helper) element = element.helper
        if ($(element).css('z-index') != this.board.zIndex) {
            $(element).css('z-index', ++this.board.zIndex);
            socket.emit('card.zIndex', {
                cardId : $(element).attr('id'),
                zIndex : $(element).css('z-index')
            });
        }
        event.stopPropagation();
    }

    Card.prototype.savePosition = function(event, ui) {
        if (zoomed) {
            notification.add(
                'Cards can not be moved whilst zoomed in',
                'error'
            )
            return
        }
        var position = { 
            x: $(this).css('left').substring(0, $(this).css('left').length - 2),
            y: $(this).css('top').substring(0, $(this).css('top').length - 2)
        }
        socket.emit('card.moved', {
            cardId : $(this).attr('id'),
            position : position            
        });
        if (event) event.stopPropagation();
    }
    Card.prototype.updatePosition = function(event, ui) {
        if (zoomed) return
        var position = { 
            x: $(this).css('left').replace('px', ''),
            y: $(this).css('top').replace('px', '')
        };
        socket.emit('card.moving', {
            cardId : $(this).attr('id'),
            position : position
        });
        event.stopPropagation();
    }
    Card.prototype.setPosition = function(id, position) {
        element = $('#' + id);
        x = position.x; 
        y = position.y; 
        element.css('top', y + 'px').css('left', x + 'px')
            .css('position', 'absolute');
    }
    
    Card.prototype.scrollTo = function(id) {
        var viewport = $('.viewport');
        var element = $('#' + id);
        if (element.length == 0) return;
        newOffsetX = (window.innerWidth / 2) 
            - (parseFloat(viewport.css('left').replace('px', '')) + parseFloat(element.css('left').replace('px', '')))
            - (parseFloat(element.css('width').replace('px', '')) / 2);
        newOffsetY = (window.innerHeight / 2) 
            - (parseFloat(viewport.css('top').replace('px', '')) + parseFloat(element.css('top').replace('px', '')))
            - (parseFloat(element.css('height').replace('px', '')) / 2);
        self = this;
        counter = 0;
        viewport.animate({
                top: parseFloat(viewport.css('top').replace('px', '')) + newOffsetY,
                left: parseFloat(viewport.css('left').replace('px', '')) + newOffsetX,
            }, 
            {
                step: function() {
                    if (counter > 20) {
                        $(window).resize();
                        var evt = document.createEvent('UIEvents');
                        evt.initUIEvent('resize', true, true, window, 1);
                        window.dispatchEvent(evt);
                        counter = 0;
                    } else {
                        counter++;
                    }
                },
                complete: function() {
                    $(window).resize();
                    var evt = document.createEvent('UIEvents');
                    evt.initUIEvent('resize', true, true, window, 1);
                    window.dispatchEvent(evt);
                }
            },
            300);
    }
    
    Card.prototype.create = function(data) {
        if (data.zIndex) {
            stackOrder = data.zIndex;
            if (data.zIndex >= board.zIndex) {
                board.zIndex = parseInt(data.zIndex) + 1;
            }
        } else {
            stackOrder = ++board.zIndex;
            socket.emit('card.zIndex', {cardId: data.cardId, zIndex: stackOrder});
        }
        this.draw(data)        
        this.addCardListEntry(data)
        this.dynamify(data.cardId)
    }
    
    Card.prototype.draw = function(data) {
        div     = document.createElement('div');        
        card    = $(div).attr('class', 'card draggable')
            .attr('id', data.cardId)
            .attr('draggable', 'true')
            .css('z-index', stackOrder)
            .css('width', data.size.width + 'px')
            .css('height', data.size.height + 'px')
            .appendTo(".viewport");
        css = 'card-yellow';
        if (data.cssClass) {
            css = 'card-' + data.cssClass;
        }
                
        card.addClass(css);
        
        anchor = document.createElement('a');
        $(anchor).attr('name', data.cardId);
        $(anchor).appendTo($(div));
        if ((data.content || "").length > 0) 
            $(div).html('<p>' + (data.content || "").split(/\r\n|\r|\n/).join('</p><p>') + '</p>')

        if (data.size) $(card).width(data.size.width).height(data.size.height);

        this.addControls(data.cardId);
        this.setPosition(data.cardId, data.position);
    }
    
    Card.prototype.dynamify = function(id) {
        var card = $('#' + id);
        if (card.css('z-index') > board.zIndex) {
            board.zIndex = parseInt(card.css('z-index'));
        }
        var paragraphs = card.find('p');
        textarea = $(document.createElement('textarea'));
        textarea.css('width', parseFloat(card.css('width').replace('px', '') - 10))
            .css('height', parseFloat(card.css('height').replace('px', '') - 10));
        textarea.appendTo(card);
        content = ""
        paragraphs.each(function() {
            content += ($(this).html() || "") + "\n";
        })
        $(card).find('textarea').val($('<div/>').html(content).text());
        paragraphs.remove();
        var self = this
        if ('read' == board.access) {
            textarea.attr('disabled', 'disabled')
            return
        }
        card.draggable({
            cursor : "move",
            keyboard : true,
            delay : 0,
            opacity : 0.65,
            create: function(event, ui) { event.stopPropagation(); }, 
            start : function(event, element) {
                self.bringToFront(event, element);
            },
            stop : this.savePosition,
            drag : this.updatePosition,
            scroll: true,
            iframeFix: true
        });
        card.resizable({
            minHeight: 75,
            minWidth: 75,
            handles: 'se',
            resize: function(event, ui) {
                $(this).find('textarea').css('width', parseFloat($(this).css('width')) - 10)
                    .css('height', parseFloat($(this).css('height'))- 10);
            },
            stop: this.resized,
        });
        if (boardConfig.grid && boardConfig.grid.position) {
        	this.setPositionGrid(boardConfig.grid.position, id);
        }
        if (boardConfig.grid && boardConfig.grid.size) {
        	this.setSizeGrid(boardConfig.grid.size, id);
        }
    }
    
    Card.prototype.resized = function(event, ui) {
        socket.emit('card.resize', {
            cardId : $(this).attr('id'),
            size : {
                width : ui.size.width,
                height : ui.size.height
            }
        });
    }
    
    Card.prototype.addControls = function(id) {
        controls = document.createElement('div');
        $(controls).attr('class', 'controls');
        $(controls).append(''
            + '<i class="icon-magnet card-link" title="' + window.location.href + '#' + id + '">&nbsp;</i>')
        if ('read' != board.access) $(controls).append(''
            + '&nbsp;&nbsp;<i class="icon-remove card-delete write" title="Delete card">&nbsp;</i> '
            + '<i class="icon-eye-open card-colour write" title="Change card colour">&nbsp;</i> '
            + '<i class="icon-zoom-in card-zoom" title="Zoom in on this card">&nbsp;</i> '
        ) 
        $(controls).appendTo($("#" + id));
    }
    
    Card.prototype.setPositionGrid = function(size, id) {
    	var grid = gridCalc.position(size);
    	if (id != null) return $('#' + id).draggable({grid: grid});
        $('div.card').each(function(index, card) { $(card).draggable({grid: grid})})
    }
    
    Card.prototype.setSizeGrid = function(size, id) {
    	var grid = gridCalc.size(size);
    	if (id != null) return $('#' + id).resizable({grid: grid});
        $('div.card').each(function(index, card) { $(card).resizable({grid: grid}) });
    }
    Card.prototype.addCardListEntry = function(data) {
        content = "<i>No content</i>";
        if (data.content && data.content != '') {
            content = data.content.substring(0, 30) + '...';
        }
        css = 'card-yellow';
        if (data.cssClass) css = 'card-' + data.cssClass;
        cardListEntry = $(document.createElement('li'));
        cardListEntry.attr('id', 'entry-' + data.cardId);
        cardListEntry.append('<a href="#' + data.cardId + '" onclick="return false;"><span class="' + css + '"></span><p class="content-preview">' + content + '</p></a>');
        $('.card-list').find('li.no-cards').addClass('hidden');
        ul = $('.card-list').find('ul');
        cardListEntry.appendTo($(ul));
    }
    function Card(socket, infinite, board) {
        this.socket = socket;
        this.infinite = infinite;
        this.board = board;
        this.board.setCard(this);
    }
    
    var cardEntity = new Card(socket, infiniteDrag, board)

    socket.on('card.zIndex', function(data) {
        $('#' + data.cardId).css('z-index', data.zIndex);
        board.zIndex = data.zIndex;
    })
    socket.on('card.moving', function(data) {
        cardEntity.setPosition(data.cardId, data.position);
    })
    socket.on('card.list', function(data) {
        data.forEach(function(d) {
            if ($('#' + d._id).length == 0) {
                d.cardId = d._id;
                cardEntity.create(d);
            }
        })
    })
    socket.on('card.created', function(data) {
        cardEntity.create(data);
    })
    socket.on('card.resize', function(data) {
        $('#' + data.cardId).find('textarea').animate({
            width: parseFloat(data.size.width - 10) + 'px',
            height: parseFloat(data.size.height - 10) + 'px'
        });   
        $('#' + data.cardId).animate({
            width: data.size.width,
            height: data.size.height
        })
    })
    $('.viewport').on('click', '.card-delete', function(event) {
        if ('read' == board.access) return
        socket.emit('card.delete', { cardId: $(this).parents('.card').attr('id') });
        $('ul.card-list').find('li.no-cards').removeClass('hidden');
        event.stopPropagation();
    })
    socket.on('card.delete', function(data) {
        $('#' + data.cardId).remove();
        $('#entry-' + data.cardId).remove();
        if ($('li.card-list ul li').length < 2) $('.no-cards').removeClass('hidden')
        if (data.userId != user.id) notification.add(data.name + " deleted a card", 'info');
    })
    $('.viewport').on('click', '.card-link', function(event) {
    	var link = window.location.href.split('#')[0] + '#' 
    	    + $(this).parent().parent().attr('id');
    	$('#card-link-modal .card-link').html('<a href="' + link + '">' + link + '</a>');
    	$('#card-link-modal').modal(true);
    })
    $('#close-card-link-modal').on('click', function() {
        $('#card-link-modal').modal('hide');
    })

    var zoomed = false
    document.addEventListener('keyup', function(event) {
        if (event.keyCode !== 27) return
        $(zoomed).draggable('enable')
        zoomed = false 
    })
    $('.viewport').on('click', '.icon-zoom-in', function(event) {
        $(this).removeClass('icon-zoom-in').addClass('icon-zoom-out')
        zoomed = $(this).parent().parent()
        $(zoomed).draggable('disable')
        zoom.to({ element: $(this).parent().parent()[0] })
    })
    $('.viewport').on('click', '.icon-zoom-out', function(event) {
        zoom.out($(this).parent().parent()[0])
        $(zoomed).draggable('enable')
        zoomed = false
        $(this).removeClass('icon-zoom-out').addClass('icon-zoom-in')
    })
    $('.viewport').on('click', '.card-colour', function(event) {
        if ('read' == board.access) return
        card = $(this).parents('.card');
        cardListEntry = $('li.card-list')
            .find('#entry-' + card.attr('id')).find('span')
        
        cssClass = determineCssClass(card);
        card.removeClass();
        cardListEntry.removeClass();
        card.addClass('card').addClass('card-' + cssClass);
        cardListEntry.addClass('card-' + cssClass);
        socket.emit(
            'card.colour',
            { cardId: card.attr('id'), cssClass: cssClass}
        );
        event.stopPropagation();
    })
    
    $('li.card-list').on('mouseover', 'li', function(event) {
         if ($(this).attr('id')) $('#' + $(this).attr('id').replace('entry-', '')).addClass('highlight');    
    });
    $('li.card-list').on('mouseout', 'li', function(event) {
         if ($(this).attr('id')) $('#' + $(this).attr('id').replace('entry-', '')).removeClass('highlight');    
    });
    $('li.card-list').on('click', 'li', function(event) {
         cardEntity.scrollTo($(this).attr('id').replace('entry-', ''));
    });
    
    socket.on('card.colour', function(data) {
        if ('read' == board.access) return
        $('#' + data.cardId).removeClass().addClass('card').addClass('card-' + data.cssClass);
        $('#entry-' + data.cardId).find('span').removeClass().addClass('card-' + data.cssClass);
    });
    $('.viewport').on('input propertychange', '.card textarea', throttle(function(event) {
        socket.emit('card.text-change', {cardId: $(this).parent().attr('id'), content: $(this).val()})
        content = $(this).val();
        if (content.length == 0) {
            content = '<i>No content</i>';
        } else {
            content = content.substring(0, 20) + '...';
        }
        $('#entry-' + $(this).parent().attr('id')).find('p').html(content);
    }, 300))
    socket.on('card.text-change', function(data) {
        $('#' + data.cardId).find('textarea').val(htmlDecode(data.content));
        if (data.content.length == 0) {
            data.content = "<i>No content</i>";
        } else { 
            data.content = data.content.substring(0, 20) + '...';
        }
        $('#entry-' + data.cardId).find('p').html(data.content);
    })
    $('.viewport-container').on('click', '.card', function(event) {
        if ('read' == board.access) return
        cardEntity.bringToFront(event, $(this));
        event.stopPropagation();
    })
    $("div.viewport-container").click(function(e) {
        lastClick = e
        if ('read' == board.access) return
        if (board.preventCardCreation)
            return notification.add(
                "You can only create a card once every " 
                  + config.limits.card.wait + " seconds",
                "notice"
            )
        var x = e.pageX - parseFloat($('.viewport').css('left').replace('px', ''));        
        var y = e.pageY - viewport.header.height - parseFloat($('.viewport').css('top').replace('px', ''));
            if (config && config.limits && config.limits.card && config.limits.card.wait) {
                board.preventCardCreation = true;
                setTimeout(function() {
                    board.preventCardCreation = false;
                }, config.limits.card.wait * 1000);
            }
            socket.emit('card.create', {
            position : {
                x : x,
                y : y
            }
        })
    })
    
    function htmlDecode(input) {
        var e = document.createElement('div')
        e.innerHTML = input
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue
    }
    return cardEntity
})
