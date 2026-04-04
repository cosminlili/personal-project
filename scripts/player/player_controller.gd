extends CharacterBody2D

@export var speed: float = 200.0

@onready var mana_heat_component: Node = $ManaHeatComponent

func _ready() -> void:
	print("Player loaded")

func _physics_process(_delta: float) -> void:
	var direction := Vector2.ZERO

	if Input.is_action_pressed("move_right"):
		direction.x += 1
	if Input.is_action_pressed("move_left"):
		direction.x -= 1
	if Input.is_action_pressed("move_down"):
		direction.y += 1
	if Input.is_action_pressed("move_up"):
		direction.y -= 1

	direction = direction.normalized()
	velocity = direction * speed
	move_and_slide()

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("test_cast"):
		test_skill_cast()
	
	if event.is_action_pressed("test_status"):
		print_mana_heat_status()

func test_skill_cast() -> void:
	var success = mana_heat_component.use_skill(20.0, 15.0)
	
	if success:
		print("Skill usata!")
		print_mana_heat_status()
	else:
		print("Mana insufficiente!")
		print_mana_heat_status()


func print_mana_heat_status() -> void:
	print("Mana: ", int(mana_heat_component.current_mana), " / ", mana_heat_component.max_mana)
	print("Heat: ", int(mana_heat_component.current_heat), " / ", mana_heat_component.max_heat)
	print("--------------------")