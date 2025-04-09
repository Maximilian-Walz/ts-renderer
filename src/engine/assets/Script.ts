export abstract class Script {
  public abstract onCreate(): void
  public abstract onStart(): void
  public abstract onUpdate(): void
  public abstract onDestroy(): void
}
