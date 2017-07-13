/**
 * 游戏配置
 * @type {{player1: {jumpMoveOffset: number, maxBulletsNum: number, bulletClock: null}, player2: {jumpMoveOffset: number, maxBulletsNum: number, bulletClock: null}}}
 */
var GameConfig = {
    player1:{
        jumpMoveOffset : 150,//跳起之后左右移动的横向偏移距离
        maxBulletsNum : 3,//屏幕最大允许子弹数量
        bulletPower : 10,//子弹伤害值
        bloodNum : 100,//血量
        bulletClock : null//子弹飞行clock
    },
    player2:{
        jumpMoveOffset : 150,
        maxBulletsNum : 3,
        bulletPower : 10,
        bloodNum : 100,
        bulletClock : null
    }
};
/**
 * 角色类
 * @param name
 * @param el
 * @param enemyEl
 * @constructor
 */
var Player = function(name,el,enemyEl){
    el.addEventListener('animationend',gameEngine.animationEndCallBack);
    this.name = name;
    this.el = el;
    this.$el = $(this.el);
    this.$enemyEl = $(enemyEl);
    this.$bloodBarEl = $('.'+name+'-blood-area .blood-bar');
    this.jumpMoveOffset = this.name == 'player1' ? GameConfig.player1.jumpMoveOffset : GameConfig.player2.jumpMoveOffset;
    this.maxBulletsNum = this.name == 'player1' ? GameConfig.player1.maxBulletsNum : GameConfig.player2.maxBulletsNum;
    this.bulletPower = this.name == 'player1' ? GameConfig.player1.bulletPower : GameConfig.player2.bulletPower;
    this.bloodNum = this.name == 'player1' ? GameConfig.player1.bloodNum : GameConfig.player2.bloodNum;
    this.remainBloodNum = this.bloodNum;
    this.bullets = [];
};
Player.prototype = {
    constructor : Player,
    /**跳起**/
    jump : function(){
        this.$el.addClass('jump');
    },
    /**回到地面**/
    down : function(){
        if(this.$el.hasClass('jump')){
            this.$el.removeClass('jump');
            var currentBottom = this.$el.css('bottom');
            this.$el.css({bottom:currentBottom});
            var currentLeft = this.$el.css('left');
            this.$el.css({left:currentLeft});
        }
    },
    /**左移**/
    moveLeft : function(){
        if(this.$el.offset().left <= 0) return;

        if(this.$el.hasClass('jump')){
            //起跳过程中左移
            if(this.$el.offset().left < this.jumpMoveOffset){
                this.$el.css({transition : 'left 1.5s',left : 0});
            }else{
                this.$el.css({transition : 'left 1.5s',left : '-='+this.jumpMoveOffset+'px'});
            }
        }else{
            //平地左移
            if(this.$el.offset().left < 2){
                this.$el.css({left:0});
            }else{
                this.$el.css({transition : '',left:'-=2px'});
            }
        }
    },
    /**右移**/
    moveRight : function(){
        var winWidth = $(window).width();
        if(this.$el.offset().left >= winWidth-this.$el.width()) return;

        if(this.$el.hasClass('jump')){
            //起跳过程中右移
            if(winWidth-this.$el.offset().left-this.$el.width() < this.jumpMoveOffset){
                this.$el.css({transition : 'left 1.5s',left : winWidth-this.$el.width()});
            }else{
                this.$el.css({transition : 'left 1.5s',left : '+='+this.jumpMoveOffset+'px'});
            }
        }else{
            //平地右移
            if(winWidth-this.$el.offset().left-this.$el.width() < 2){
                this.$el.css({left:winWidth-this.$el.width()});
            }else{
                this.$el.css({transition : '',left:'+=2px'});
            }
        }
    },
    /**发射子弹**/
    shot : function(){
        if(this.bullets.length >= this.maxBulletsNum) return;

        //新创建一颗子弹
        var bullet = new Bullet(this);
        this.bullets.push(bullet);

        //让子弹飞起来
        if(this.bullets.length == 1){
            var playerConfig = this.name == 'player1' ? GameConfig.player1 : GameConfig.player2;
            var self = this;
            playerConfig.bulletClock = setInterval(function(){
                if(self.bullets.length == 0){
                    if(self.name == 'player1'){
                        clearInterval(GameConfig.player1.bulletClock);
                    }else{
                        clearInterval(GameConfig.player2.bulletClock);
                    }
                }
                for(var i = self.bullets.length-1;i >= 0;i--){
                    var item = self.bullets[i];
                    item.flyOneStep();
                    if(item && item.hitTarget()){
                        //准确打击目标
                        //1、目标扣血
                        gameEngine.playerList[item.player.$enemyEl.attr('id')].dropBlood(item.player.bulletPower);
                        //2、子弹爆炸
                        item.$el.remove();
                        item = null;
                        self.bullets.splice(i,1);
                    }
                    if(item && item.isOut()){
                        //飞出屏幕边界
                        item.$el.remove();
                        item = null;
                        self.bullets.splice(i,1);
                    }
                }
            },60);
        }
    },
    /**扣血**/
    dropBlood : function(power){
        this.remainBloodNum = this.remainBloodNum - power > 0 ? this.remainBloodNum - power : 0;
        //血量值减少
        this.$bloodBarEl.parent().siblings('.blood-num').text(this.remainBloodNum);
        //血量条移动
        var bloodBarElWidth = this.$bloodBarEl.width();
        var offset = (this.bloodNum-this.remainBloodNum)/this.bloodNum*bloodBarElWidth;
        this.$bloodBarEl.css(this.name == 'player1' ? {left:'-'+offset+'px'} : {right:'-'+offset+'px'});
        if(this.remainBloodNum == 0){
            //游戏结束
            gameEngine.gameOver();
        }
    }
};
/**
 * 子弹类
 * @constructor
 */
var Bullet = function(player){
    this.player = player;
    this.el = null;
    this.$el = null;
    this.init();
};
Bullet.prototype = {
    constructor : Bullet,
    init : function(){
        this.el = document.createElement('span');
        this.$el = $(this.el);
        this.$el.addClass('bullet');
        $('body').append(this.$el);

        var $source = this.player.$el,
            $target = this.player.$enemyEl;
        if($target.offset().left > $source.offset().left){
            //敌人在右边，向右发射子弹
            this.$el.addClass(this.player.name == 'player1' ? 'player-1-bullet-right' : 'player-2-bullet-right');
            this.$el.css({left:$source.offset().left+$source.width(),top:$source.offset().top+$source.height()/2});
        }else{
            //敌人在左边，向左发射子弹
            this.$el.addClass(this.player.name == 'player1' ? 'player-1-bullet-left' : 'player-2-bullet-left');
            this.$el.css({left:$source.offset().left-this.$el.width(),top:$source.offset().top+$source.height()/2});
        }
    },
    /**让子弹飞**/
    flyOneStep : function(){
        var $me = this.$el;
        if($me.hasClass('player-1-bullet-right')||$me.hasClass('player-2-bullet-right')){
            $me.css({left:'+=5px'});
        }else if($me.hasClass('player-1-bullet-left')||$me.hasClass('player-2-bullet-left')){
            $me.css({left:'-=5px'});
        }
    },
    /**碰撞检测**/
    hitTarget : function(){
        var $me = this.$el;
        var $target = this.player.$enemyEl;

        var l1 = $me.offset().left;
        var r1 = $me.offset().left + $me.width();
        var t1 = $me.offset().top;
        var b1 = $me.offset().top + $me.height();
        var l2 = $target.offset().left;
        var r2 = $target.offset().left + $target.width();
        var t2 = $target.offset().top;
        var b2 = $target.offset().top + $target.height();

        if(r1<l2 || b1<t2 || l1>r2 || t1>b2) return false;
        return true;
    },
    /**飞出屏幕**/
    isOut : function(){
        var winWidth = $('body').width();
        var offsetLeft = this.$el.offset().left;
        if(offsetLeft <= -this.$el.width() || offsetLeft >= winWidth) return true;
        return false;
    }
};

/**
 * 主方法
 * @type {{init, onKeyDown, animationEndCallBack, crash}}
 */
var gameEngine = function(){

    var player1,player2 = null;
    var playerList = {};

    var init = function(){
        //初始化角色
        initPlayers();
        //keydown事件
        $('body').on('keydown',gameEngine.onKeyDown);
    };

    var initPlayers = function(){
        player1 = new Player('player1',document.getElementById('player1'),document.getElementById('player2'));
        player2 = new Player('player2',document.getElementById('player2'),document.getElementById('player1'));
        playerList.player1 = player1;
        playerList.player2 = player2;

        $('.player1-blood-area .blood-num').text(player1.bloodNum);
        $('.player2-blood-area .blood-num').text(player2.bloodNum);
    };

    var onKeyDown = function(event){
        if(event.keyCode == 65){
            //A
            player1.moveLeft();
        }else if(event.keyCode == 87){
            //W
            player1.jump();
        }else if(event.keyCode == 68){
            //D
            player1.moveRight();
        }else if(event.keyCode == 83){
            //S
            player1.down();
        }else if(event.keyCode == 37){
            //方向键左
            player2.moveLeft();
        }else if(event.keyCode == 38){
            //方向键上
            player2.jump();
        }else if(event.keyCode == 39){
            //方向键右
            player2.moveRight();
        }else if(event.keyCode == 40){
            //方向键下
            player2.down();
        }else if(event.keyCode == 32){
            //空格
            player1.shot();
        }else if(event.keyCode == 17){
            //ctrl
            player2.shot();
        }
    };

    var animationEndCallBack = function(e){
        $(this).removeClass('jump');
        var currentLeft = $(this).css('left');
        $(this).css({left:currentLeft});
    };

    var gameOver = function(){
        //移除所有子弹
    };

    return {
        playerList : playerList,
        init : init,
        onKeyDown : onKeyDown,
        animationEndCallBack : animationEndCallBack,
        gameOver : gameOver
    };
}();

$(function(){
    gameEngine.init();
});
