const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.02
const strokeFactor : number = 90
const sizeFactor : number = 8
const delay : number = 30
const foreColor : string = "#2196F3"
const backColor: string = "#BDBDBD"

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    vaContainer : VanishingArcContainer = new VanishingArcContainer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
        this.vaContainer.draw(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = (event) => {
            this.vaContainer.handleTap(event.offsetX, event.offsetY)
        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += scGap * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }

    static sinify(scale : number, n : number) : number {
        return Math.sin(scale * Math.PI / n)
    }

    static cosify(scale : number, n : number) : number {
        return Math.sin(scale * Math.PI / n)
    }
}

class DrawingUtil {

    static drawArc(context : CanvasRenderingContext2D, r : number, sc : number) {
        const sf : number = ScaleUtil.sinify(sc, 1)
        const deg = 360 * sf
        context.beginPath()
        context.moveTo(0, 0)
        for (var i = 0; i <= deg; i++) {
            const x : number = r * Math.cos(i * Math.PI / 180)
            const y : number = r * Math.sin(i * Math.PI / 180)
            context.lineTo(x, y)
        }
        context.fill()
    }

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawVanishingArc(context : CanvasRenderingContext2D, size : number, scale : number) {
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 3)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 3)
        const sc3 : number = ScaleUtil.divideScale(scale, 2, 3)
        const sf1 : number = ScaleUtil.sinify(sc1, 2)
        const sf2 : number = ScaleUtil.sinify(sc2, 1)
        const sf3 : number = ScaleUtil.cosify(sc3, 2)
        const sf1a : number = sf2 <= 0 ? sf1 : 0
        const sf3a : number = sf2 >= 1 ? sf3 : 0
        DrawingUtil.drawLine(context, 0, 0, size * (sf1a + sf3a), 0)
        DrawingUtil.drawArc(context, size, sf2)
    }

    static drawVANode(context : CanvasRenderingContext2D, x : number, y : number, sc : number) {
        const size : number = Math.min(w, h) / sizeFactor
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.strokeStyle = foreColor
        context.fillStyle = foreColor
        DrawingUtil.drawVanishingArc(context, size, sc)
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class VANode {

    state : State = new State()

    constructor(private x : number, private y : number) {

    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawVANode(context, this.x, this.y, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }
}

class VanishingArcContainer {

    vaNodes : Array<VANode> = new Array()
    animator : Animator = new Animator()

    draw(context : CanvasRenderingContext2D) {
        this.vaNodes.forEach((vaNode) => {
            vaNode.draw(context)
        })
    }

    update() {
        for (var i = this.vaNodes.length - 1; i >= 0; i--) {
            const va : VANode = this.vaNodes[i]
            va.update(() => {
                this.vaNodes.splice(i, 1)
                if (this.vaNodes.length == 0) {
                    this.animator.stop()
                }
            })
        }
    }

    handleTap(x : number, y : number) {
        const vaNode = new VANode(x, y)
        vaNode.startUpdating(() => {
            this.vaNodes.push(vaNode)
            if (this.vaNodes.length == 1) {
                this.animator.start(() => {
                    this.update()
                })
            }
        })
    }
}
